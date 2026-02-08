const cron = require("node-cron");
const Razorpay = require("razorpay");
const {
  Revenue,
  PaymentLog,
  EmailTemplate,
} = require("../../models");
const { sendEmail } = require("../../helpers/email.helper");
const payoutLogger = require("../../helpers/payoutLogger");

/* ------------------------------------
   Safe Razorpay payout wrapper
------------------------------------ */
async function safeCreatePayout(razorpay, payload) {
  // 🔴 RazorpayX NOT enabled → payouts API missing
  if (!razorpay.payouts || !razorpay.payouts.create) {
    payoutLogger.warn("Razorpay payouts API not available. Using mock payout.");

    return {
      id: "mock_payout_" + Date.now(),
      status: "processed",
      mock: true,
    };
  }

  return new Promise((resolve, reject) => {
    razorpay.payouts.create(payload, (err, payout) => {
      if (err) return reject(err);
      resolve(payout);
    });
  });
}

/**
 * Every 10 seconds (LOCAL)
 * Change to "0 2 * * *" for production
 */
cron.schedule("*/10 * * * * *", async () => {
  payoutLogger.info("Seller payout cron started");

  try {
    const revenues = await Revenue.find({
      status: "PENDING",
    }).populate("sellerId", "razorpayFundAccountId name email");

    if (!revenues.length) {
      payoutLogger.info("No pending payouts");
      return;
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    
    for (const revenue of revenues) {
      try {
        if (!revenue.sellerId?.razorpayFundAccountId) {
          payoutLogger.warn("Seller fund account missing", {
            revenueId: revenue._id,
          });
          continue;
        }

        /* 🔒 Lock row */
        revenue.status = "PROCESSING";
        await revenue.save();

        const payout = await safeCreatePayout(razorpay, {
          account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
          fund_account_id: revenue.sellerId.razorpayFundAccountId,
          amount: Math.round(revenue.sellerAmount * 100),
          currency: "INR",
          mode: "IMPS",
          purpose: "payout",
          queue_if_low_balance: true,
          reference_id: revenue._id.toString(),
          narration: "NotesBytes Seller Payout",
        });

        /* ✅ Update revenue */
        revenue.status = "SETTLED";
        revenue.payoutId = payout.id;
        await revenue.save();

        const log = await PaymentLog.create({
            invoiceId: null,
            userId: revenue.sellerId._id,
            gateway: "razorpay",
            paymentId:payout.id,
            orderId: revenue.orderId.toString(), // ensure string
            eventType: "payout_success",
            amount: revenue.sellerAmount,
            currency: "INR",
            status: "SUCCESS",
            logData: payout,
        });

        /* 📧 Email */
        const template = await EmailTemplate.findOne({
          key: "SELLER_PAYOUT",
          isActive: true,
        });

        if (template && revenue.sellerId.email) {
          const emailBody = template.body
            .replace("{{name}}", revenue.sellerId.name)
            .replace("{{amount}}", revenue.sellerAmount.toFixed(2))
            .replace("{{payoutId}}", payout.id)
            .replace("{{orderId}}", revenue.orderId || "-");

          await sendEmail({
            to: revenue.sellerId.email,
            subject: template.subject.replace(
              "{{amount}}",
              revenue.sellerAmount.toFixed(2)
            ),
            html: emailBody.replace(/\n/g, "<br/>"),
          });
        }

        payoutLogger.info("Payout completed", {
          revenueId: revenue._id,
          payoutId: payout.id,
          mock: payout.mock || false,
        });

      } catch (err) {
        revenue.status = "FAILED";
        await revenue.save();

        payoutLogger.error("Payout failed", {
          revenueId: revenue._id,
          error: err.message,
          stack: err.stack,
        });

        await PaymentLog.create({
          invoiceId: null,
          userId: revenue.sellerId?._id,
          gateway: "razorpay",
          orderId: revenue.orderId,
          eventType: "payout_failed",
          amount: revenue.sellerAmount,
          currency: "INR",
          status: "FAILED",
          logData: { error: err.message },
        });
      }
    }
  } catch (err) {
    payoutLogger.error("Seller payout cron crashed", {
      error: err.message,
      stack: err.stack,
    });
  }
});