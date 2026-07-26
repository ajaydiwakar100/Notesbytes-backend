const cron = require("node-cron");
const Razorpay = require("razorpay");

const PaymentService = require("../../services/payment.service.js");
const { PurchaseOrder } = require("../../models/index.js");
const Logger = require("../../helpers/logger.js");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

cron.schedule("*/10 * * * * *", () => {
    console.log("Cron Working", new Date());
});

cron.schedule("*/10 * * * * *", async () => {

    Logger.payment("========================================================");
    Logger.payment("PAYMENT RECOVERY CRON STARTED");
    Logger.payment(`Time : ${new Date().toISOString()}`);

    try {

        //------------------------------------------------------
        // Find Pending Orders
        //------------------------------------------------------

        const pendingOrders = await PurchaseOrder.find({
            paymentStatus: "PENDING",
            // createdAt: {
            //     $lte: new Date(Date.now() - 60 * 1000)
            // }
        });

        Logger.payment(
            `Pending Orders Found : ${pendingOrders.length}`
        );

        //------------------------------------------------------
        // No Orders
        //------------------------------------------------------

        if (!pendingOrders.length) {

            Logger.payment("No Pending Orders.");
            Logger.payment("CRON COMPLETED");
            Logger.payment("========================================================");

            return;

        }

        //------------------------------------------------------
        // Process Orders
        //------------------------------------------------------

        for (const order of pendingOrders) {

            Logger.payment("--------------------------------------------");
            Logger.payment(`Purchase Order : ${order._id}`);
            Logger.payment(`Razorpay Order : ${order.razorpayOrderId}`);
            Logger.payment(`User : ${order.userId}`);
            Logger.payment(`Amount : ${order.amount}`);

            try {

                //--------------------------------------------------
                // Fetch Payments from Razorpay
                //--------------------------------------------------

                Logger.payment(
                    `Fetching Payment From Razorpay : ${order.razorpayOrderId}`
                );

                const payments =
                    await razorpay.orders.fetchPayments(
                        order.razorpayOrderId
                    );

                Logger.payment(
                    `Payments Returned : ${payments.items.length}`
                );

                //--------------------------------------------------
                // No Payments
                //--------------------------------------------------

                if (!payments.items.length) {

                    Logger.payment(
                        `No Payment Found For ${order.razorpayOrderId}`
                    );

                    continue;

                }

                //--------------------------------------------------
                // Captured Payment
                //--------------------------------------------------

                const payment = payments.items.find(
                    item => item.status === "captured"
                );

                if (!payment) {

                    Logger.payment(
                        `Payment Not Captured Yet : ${order.razorpayOrderId}`
                    );

                    continue;

                }

                Logger.payment("Captured Payment Found");
                Logger.payment(`Payment ID : ${payment.id}`);
                Logger.payment(`Method : ${payment.method}`);
                Logger.payment(`Status : ${payment.status}`);

                //--------------------------------------------------
                // Complete Payment
                //--------------------------------------------------

                Logger.payment(
                    `Calling completePayment()`
                );

                await PaymentService.completePayment({
                    orderId: order.razorpayOrderId,
                    paymentId: payment.id,
                    paymentMethod: payment.method,
                    signature: null,
                    source: "CRON"
                });

                Logger.payment(
                    `Order Successfully Recovered : ${order.razorpayOrderId}`
                );

            }

            catch (error) {

                Logger.error("--------------------------------------------");
                Logger.error("Recovery Failed");
                Logger.error(`Order : ${order.razorpayOrderId}`);
                Logger.error(error.message);

                if (error.stack) {
                    Logger.error(error.stack);
                }

            }

        }

        Logger.payment("CRON FINISHED SUCCESSFULLY");
        Logger.payment("========================================================");

    }

    catch (error) {

        Logger.error("========================================================");
        Logger.error("PAYMENT RECOVERY CRON FAILED");
        Logger.error(error.message);

        if (error.stack) {
            Logger.error(error.stack);
        }

        Logger.error("========================================================");

    }

});