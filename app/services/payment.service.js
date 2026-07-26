const mongoose = require("mongoose");
const { Document,User, Wishlist, Cart, Invoice, PaymentLog, PurchaseOrder, EmailTemplate, ReviewAndRating, GlobalSetting, Revenue, Refferal, PaymentDetail} = require("../models/index.js");
const { sendDynamicTemplateEmail } = require("../helpers/email.helper.js");

const PaymentService = {

    normalizeUploadPath: (fullPath) => {
        if (!fullPath) return "";
        const normalized = fullPath.replace(/\\/g, "/");
        const uploadsIndex = normalized.indexOf("uploads/");
        return uploadsIndex !== -1? normalized.substring(uploadsIndex): "";
    },

    /**
     * Complete Payment
     */
    async completePayment({orderId, paymentId, signature = null, paymentMethod = null,source = "API"}) {

        const session = await mongoose.startSession();

        try {

            session.startTransaction();

            //--------------------------------------------------
            // Get Purchase Order FIRST (Idempotency)
            //--------------------------------------------------

            const purchaseOrder = await PurchaseOrder.findOne({
                razorpayOrderId: orderId,
            })
                .session(session)
                .populate("userId", "name email")
                .populate(
                    "items.productId",
                    "title shortDescription price finalPrice author subject exam language pages format filePath sellerId uploadedBy"
                );

            if (!purchaseOrder) {
                throw new Error("Purchase Order not found.");
            }

            //--------------------------------------------------
            // Already Processed
            //--------------------------------------------------

            if (purchaseOrder.paymentStatus === "SUCCESS") {
                await session.abortTransaction();
                return purchaseOrder;
            }

            //--------------------------------------------------
            // Get Settings
            //--------------------------------------------------

            const settings = await GlobalSetting.findOne({}).session(session);

            //--------------------------------------------------
            // Update Invoice
            //--------------------------------------------------

            const invoice = await Invoice.findOne({
                orderId,
            }).session(session);

            if (!invoice) {
                throw new Error("Invoice not found.");
            }

            if (invoice.status !== "SUCCESS") {

                invoice.paymentId = paymentId;
                invoice.status = "SUCCESS";

                await invoice.save({ session });

            }

            //--------------------------------------------------
            // Payment Log
            //--------------------------------------------------

            const paymentLog = await PaymentLog.findOne({
                paymentId,
                eventType: "payment_success",
            }).session(session);

            if (!paymentLog) {

                await PaymentLog.create([
                    {
                        invoiceId: invoice._id,
                        userId: invoice.userId,
                        gateway: "razorpay",
                        orderId,
                        paymentId,
                        status: "SUCCESS",
                        eventType: "payment_success",
                        amount: invoice.amount,
                        paymentMethod,
                        source,
                    },
                ], { session });

            }

            //--------------------------------------------------
            // Update Purchase Order
            //--------------------------------------------------

            purchaseOrder.status = "PAID";
            purchaseOrder.paymentStatus = "SUCCESS";
            purchaseOrder.paymentId = paymentId;
            purchaseOrder.signature = signature;
            purchaseOrder.paymentMethod = paymentMethod;
            purchaseOrder.paidAt = new Date();

            await purchaseOrder.save({ session });

            //--------------------------------------------------
            // Buyer
            //--------------------------------------------------

            const buyer = purchaseOrder.userId;

            if (!buyer) {
                throw new Error("Buyer not found.");
            }

            //--------------------------------------------------
            // Update Downloads
            //--------------------------------------------------

            const bulkUpdates = purchaseOrder.items
                .filter(item => item.productId)
                .map(item => ({
                    updateOne: {
                        filter: {
                            _id: item.productId._id,
                        },
                        update: {
                            $inc: {
                                noOfDownloads: item.quantity || 1,
                            },
                        },
                    },
                }));

            if (bulkUpdates.length) {
                await Document.bulkWrite(bulkUpdates, {
                    session,
                });
            }

            //--------------------------------------------------
            // Referral
            //--------------------------------------------------

            await PaymentService.processReferral(
                purchaseOrder,
                buyer,
                settings,
                session
            );

            //--------------------------------------------------
            // Seller Revenue
            //--------------------------------------------------

            await PaymentService.createSellerRevenue(
                purchaseOrder,
                buyer,
                session
            );

            //--------------------------------------------------
            // Clear Cart
            //--------------------------------------------------

            await Cart.updateOne(
                {
                    user: buyer._id,
                },
                {
                    $set: {
                        items: [],
                    },
                },
                {
                    session,
                }
            );

            //--------------------------------------------------
            // Commit
            //--------------------------------------------------

            await session.commitTransaction();

            //--------------------------------------------------
            // Send Email (Outside Transaction)
            //--------------------------------------------------

            try {

                await PaymentService.sendOrderConfirmation(
                    purchaseOrder,
                    buyer
                );

            } catch (emailError) {

                console.error(
                    "Email Error:",
                    emailError.message
                );

            }

            return {
                invoice,
                purchaseOrder,
            };

        } catch (error) {

            await session.abortTransaction();

            throw error;

        } finally {

            session.endSession();

        }

    },

    /**
     * Referral Logic
     */
    async processReferral(purchaseOrder, buyer, settings, session) {

        //--------------------------------------------------
        // Find Pending Referral
        //--------------------------------------------------
        const referralRecord = await Refferal.findOne({
            referred_user_id: buyer._id,
            status: "pending",
            is_first_purchase: true,
        }).session(session);

        if (!referralRecord) {
            return;
        }

        //--------------------------------------------------
        // Calculate Commission
        //--------------------------------------------------
        const referralPercent = Number(settings?.refferalCommission ?? 5);
        const maxReferralAmount = Number(settings?.minRefferalAmt ?? 20);
        const orderAmount = Number(purchaseOrder.amount);

        let referralCommission = (orderAmount * referralPercent) / 100;

        referralCommission = Math.min(
            referralCommission,
            maxReferralAmount
        );

        referralCommission = Number(referralCommission.toFixed(2));

        //--------------------------------------------------
        // Prevent Duplicate Referral Revenue
        //--------------------------------------------------
        const existingRevenue = await Revenue.findOne({
            orderId: purchaseOrder._id,
            payoutType: "Referal Payout",
        }).session(session);

        if (existingRevenue) {
            return;
        }

        //--------------------------------------------------
        // Update Referral Record
        //--------------------------------------------------
        referralRecord.status = "completed";
        referralRecord.order_id = purchaseOrder._id;
        referralRecord.order_amount = orderAmount;
        referralRecord.commission_percent = referralPercent;
        referralRecord.commission_amount = referralCommission;
        referralRecord.commission_status = "paid";
        referralRecord.referral_code_used = true;
        referralRecord.completed_at = new Date();
        referralRecord.is_first_purchase = false;

        await referralRecord.save({ session });

        //--------------------------------------------------
        // Create Referral Revenue
        //--------------------------------------------------
        await Revenue.create(
            [{
                orderId: purchaseOrder._id,
                sellerId: buyer._id,
                buyerId: buyer._id,
                totalAmount: orderAmount,
                adminCommission: 0,
                sellerAmount: referralCommission,
                commissionPercent: referralPercent,
                status: "PENDING",
                payoutType: "Referal Payout",
            }],
            { session }
        );

        console.log(
            `Referral commission ₹${referralCommission} applied for user ${buyer._id}`
        );

        return referralCommission;
    },


    /**
     * Create Seller Revenue
     */
    async createSellerRevenue(purchaseOrder, buyer, session) {

        //--------------------------------------------------
        // Existing Revenues
        //--------------------------------------------------

        const existingRevenue = await Revenue.find({
            orderId: purchaseOrder._id,
            payoutType: "Seller Payout",
        })
            .select("sellerId")
            .session(session);

        const existingSellerIds = new Set(
            existingRevenue.map(r => r.sellerId.toString())
        );

        //--------------------------------------------------
        // Aggregate Seller Revenue
        //--------------------------------------------------

        const sellerRevenueMap = new Map();

        for (const item of purchaseOrder.items) {

            const sellerId =
                item.sellerId ||
                item.productId?.sellerId ||
                item.productId?.uploadedBy;

            if (!sellerId) {
                console.warn(`Seller not found for product ${item.productId}`);
                continue;
            }

            if (existingSellerIds.has(sellerId.toString())) {
                continue;
            }

            const baseAmount =
                Number(item.price) * Number(item.quantity);

            const finalPrice =
                Number(
                    item.finalPrice ??
                    item.productId?.finalPrice ??
                    baseAmount
                );

            const platformFee = finalPrice - baseAmount;

            if (!sellerRevenueMap.has(sellerId.toString())) {

                sellerRevenueMap.set(sellerId.toString(), {
                    orderId: purchaseOrder._id,
                    sellerId,
                    buyerId: buyer._id,
                    totalAmount: 0,
                    adminCommission: 0,
                    sellerAmount: 0,
                    commissionPercent: 0,
                    status: "PENDING",
                    payoutType: "Seller Payout"
                });

            }

            const revenue = sellerRevenueMap.get(sellerId.toString());

            revenue.totalAmount += finalPrice;
            revenue.adminCommission += platformFee;
            revenue.sellerAmount += baseAmount;

        }

        //--------------------------------------------------
        // Insert Revenues
        //--------------------------------------------------

        const revenueData = Array.from(
            sellerRevenueMap.values()
        );

        if (revenueData.length) {

            await Revenue.insertMany(
                revenueData,
                {
                    session
                }
            );

        }

        return revenueData;

    },

    /**
     * Send Order Confirmation Email
     */
    async sendOrderConfirmation(purchaseOrder, buyer) {

        try {

            //--------------------------------------------------
            // Validate Buyer Email
            //--------------------------------------------------

            if (!buyer?.email) {
                console.warn("Buyer email not found.");
                return;
            }

            //--------------------------------------------------
            // Prepare Email Items
            //--------------------------------------------------

            const parsedItems = purchaseOrder.items.map(item => ({
                title: item.productId?.title || item.title,
                price: item.productId?.price || item.price,
                quantity: item.quantity
            }));

            //--------------------------------------------------
            // Generate HTML
            //--------------------------------------------------

            const itemsHTML = await buildOrderItemsHTML(parsedItems);

            //--------------------------------------------------
            // Send Email
            //--------------------------------------------------

            await sendDynamicTemplateEmail({
                to: buyer.email,
                templateKey: "ORDER_CONFIRMATION",
                variables: {
                    name: buyer.name,
                    orderId: purchaseOrder._id.toString(),
                    amount: purchaseOrder.amount,
                    items: itemsHTML
                }

            });

            console.log(
                `Order confirmation email sent to ${buyer.email}`
            );

        } catch (error) {

            console.error(
                "Order confirmation email failed:",
                error.message
            );

        }

    }

};

module.exports = PaymentService;