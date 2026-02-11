const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    subscriptionId: { type: String }, //id
    planId: { type: String }, // type of plan
    status: { type: String }, // status
    start: { type: Date }, //Start date of the subscription
    end: { type: Date}, // End of current subscription period
    lastBillDate: { type: Date }, // The date on which the last payment was made
    nextBillDate: { type: Date }, // The next date oon which will be charged
    paymentsMade: { type: Date },// Number of payments made so far in the subscription.
    pamentsRemaining: { type: Number } // Number of payments remaining in the subscription.
});

const userSchema = new mongoose.Schema({
    name : {type: String, required: true},
    email : {type: String, required: true, unique: true},
    password : {type: String, required: false}, // FOR NOW ITS ONLY TEXT AND !ENCRYPTED
    googleId : {type: String, required: false}, // For Google OAuth Users
    role: {type: String, required: true, default:'admin'},
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    credits: {type: Number, default:1 }, //free credit to create 1 group
    subscription: {type: subscriptionSchema, required: false},
    // OTP fields for password reset
    resetOtp: {type: String, required: false}, // Hashed OTP
    resetOtpExpiry: {type: Date, required: false}, // OTP expiration time
    resetOtpAttempts: {type: Number, default: 0}, // Failed verification attempts
    resetOtpLastRequest: {type: Date, required: false} // Rate limiting
});

module.exports = mongoose.model('User', userSchema);