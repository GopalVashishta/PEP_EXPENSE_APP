const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : {type: String, required: true},
    email : {type: String, required: true, unique: true},
    password : {type: String, required: false}, // FOR NOW ITS ONLY TEXT AND !ENCRYPTED
    googleId : {type: String, required: false}, // For Google OAuth Users
    role: {type: String, required: true},
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    // OTP fields for password reset
    resetOtp: {type: String, required: false}, // Hashed OTP
    resetOtpExpiry: {type: Date, required: false}, // OTP expiration time
    resetOtpAttempts: {type: Number, default: 0}, // Failed verification attempts
    resetOtpLastRequest: {type: Date, required: false} // Rate limiting
});

module.exports = mongoose.model('User', userSchema);