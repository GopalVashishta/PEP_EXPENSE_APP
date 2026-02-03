const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : {type: String, required: true},
    email : {type: String, required: true, unique: true},
    password : {type: String, required: false}, // FOR NOW ITS ONLY TEXT AND !ENCRYPTED
    googleId : {type: String, required: false} // For Google OAuth Users
});

module.exports = mongoose.model('User', userSchema);