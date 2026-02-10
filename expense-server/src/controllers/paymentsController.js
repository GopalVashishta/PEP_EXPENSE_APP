require('dotenv').config();
const { CREDIT_TO_PAISA_MAPPING } = require('../constants/paymentConstants');
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
            const user = await Users.findById({_id: req.user._id});
            user.credits += Number(credits);
            await user.save();
            return resp.json({user: user, message: "Payment successful and credits added to user account" });

        }
        catch (error) {
            console.log(error);
            return resp.status(500).json({ message: "Internal Server Error" })
        }
    }
};
module.exports = paymentsController;