const mongoose = require('mongoose');

const splitDetailSchema = new mongoose.Schema({
    memberEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    isPaid: { type: Boolean, default: false }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    title: { type: String, required: true },
    description: { type: String, required: false },
    totalAmount: { type: Number, required: true },
    paidBy: { type: String, required: true }, // email of the member who paid
    createdAt: { type: Date, default: Date.now },
    splitDetails: [splitDetailSchema], // array of member splits with amounts
    isSettled: { type: Boolean, default: false }
});

module.exports = mongoose.model('Expense', expenseSchema);
