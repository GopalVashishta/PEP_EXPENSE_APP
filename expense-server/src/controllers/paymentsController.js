require('dotenv').config();
const { CREDIT_TO_PAISA_MAPPING, PLAN_IDS } = require('../constants/paymentConstants');
const crypto = require('crypto');
const Users = require('../model/users');
const Razorpay = require('razorpay');

/*
const razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})
*/

const paymentsController = {
    //step-2 from sequence diagram
    createOrder: async (req, resp) => {
        try {
            const { credits } = req.body;
            if (!CREDIT_TO_PAISA_MAPPING[credits]) {
                return resp.status(400).json({ message: "Invalid credit value" });
            }
            const amountInPaise = CREDIT_TO_PAISA_MAPPING[credits];
            const order = await razorpayClient.orders.createOrder({
                amount: amountInPaise,
                currency: "INR",
                receipt: `receipt_${Date.now()}`
            });
            resp.json({ order: order }) //by default in express status == 200
        } catch (error) {
            console.log(error);
            return resp.status(500).json({ message: "Internal Server Error" })
        }
    },
    // step-8 from sequence diagram
    verifyOrder: async (req, resp) => {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits } = req.body;
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)// create uniq digital fingerprint of secret key
                .update(body.toString())//feed both hmac and body to hashing func
                .digest('hex'); // convert hashed string to hexadecimal string

            if (expectedSignature !== razorpay_signature) {
                return resp.status(400).json({ message: "Invalid transaction" });
            }
            const user = await Users.findById({ _id: req.user._id });
            user.credits += Number(credits);
            await user.save();
            return resp.json({ user: user, message: "Payment successful and credits added to user account" });

        }
        catch (error) {
            console.log(error);
            return resp.status(500).json({ message: "Internal Server Error" })
        }
    },

    createSubscription: async (req, resp) => {
        try {
            const { plan_name } = req.body;
            if (!PLAN_IDS[plan_name]) {
                return resp.status(400).json({ message: "Invalid Plan Name" });
            }
            const plan = PLAN_IDS[plan_name];
            const subscription = await razorpayClient.subscriptions.create({
                plan_id: plan.id,
                customer_notify: 1,
                total_count: plan.totalBillingCycle,
                notes: {
                    userId: req.user._id
                }
            });
            return resp.json({ subscription: subscription });
        } catch (error) {
            console.log(error)
            return resp.status(500).json({ message: 'Internal Server Error: payment createSubs failed' });
        }
    },

    captureSubscription: async (req, resp) => {
        try {
            const { subscriptionId } = req.body;
            const subscription = await razorpayClient.subscriptions.fetch(subscriptionId);
            const user = await Users.findById({ _id: subscription.notes.userId });
            // This obj will halep us know on the UI whether its ok for user to
            // initiate another subscription or one is alerady in progress.
            // We dont want user to inititate multiple subscriptions at a time.
            user.subscription = {
                subscriptionId: subscription.id,
                planId: subscription.plan_id,
                status: subscription.status,
            }
            await user.save();
            return resp.json({ user: user });
        } catch (error) {
            console.log(error);
            return resp.status(500).json({ message: 'Internal Server Error: payment captureSubs failed' });
        }
    },

    handleWebhookEvents: async (req, resp) => {
        try {
            console.log('Received Event');
            const signature = req.header['x-razorpay-signature'];
            const body = req.body;

            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)//gen the secret later
                .update(body)
                .digest('hex');

            if (expectedSignature !== signature) {
                return resp.status(400).send({ message: "Invalid signature." });
            };

            const payload = JSON.parse(body);
            console.log(JSON.stringify(payload, null, 2));

            const event = payload.event;
            const subscriptionData = payload.payload.subscription.entry;
            const razorpaySubscriptionId = subscriptionData.id;
            const userId = subscriptionData.notes?.userId;
            if (!userId) {
                console.log("UserId not found in the notes");
                return resp.status(400).send('UserId not found in the notes');
            }

            let newStatus;
            switch (event) {
                case 'subscription.activate':
                    newStatus = 'active';
                    break;
                case 'subscription.pendint':
                    newStatus = 'pending';
                    break;
                case 'subscription.cancelled':
                    newStatus = 'cancelled';
                    break;
                case 'subscription.completed':
                    newStatus = 'completed';
                    break;
                default:
                    console.log(`Unhandeled event received: ${event}`);
                    return resp.status(200).send(`Unhandeled event received: ${event}`);
            };

            const user = await Users.findByIdAndUpdate(
                { _id: userId },
                {
                    $set: {
                        'subscription.subscriptionId': razorpaySubscriptionId,
                        'subscription.status': newStatus,
                        'subscription.planId': subscriptionData.plan_id,
                        'subscription.start': subscriptionData.start_at ?
                            new Date(subscriptionData.start_at * 1000) : null,
                        'subscription.end': subscriptionData.end_at ?
                            new Date(subscriptionData.end_at * 1000) : null,
                        'subscription.lastBillDate': subscriptionData.current_start ?
                            new Date(subscriptionData.current_start * 1000) : null,
                        'subscription.nextBillDate': subscriptionData.current_end ?
                            new Date(subscriptionData.current_end * 1000) : null,
                        'subscription.paymentsMade': subscriptionData.paid_count,
                        'subscription.paymentsRemaining': subscriptionData.remaining_count
                    }
                }, { new: true }
            );
            
            if(!user){
                console.log("No user with provided userId exists");
                return resp.status(400).send('No user with provided userId exists');
            }
            console.log(`Update subscription status for the user ${user.email} to ${newStatus}`);
            return resp.status(200).send(`Event processed for user ${user.email} and subscription status updated to ${newStatus}`); 

        } catch (error) {
            console.log(error);
            return resp.status(500).json({ message: "Internal Server Error: payment webhook failed" })
        }
    },
};

module.exports = paymentsController;