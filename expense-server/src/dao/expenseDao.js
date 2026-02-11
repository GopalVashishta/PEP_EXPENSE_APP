const Expense = require('../model/expense');
const Group = require('../model/group');

const expenseDao = {
    // Create a new expense
    create: async (data) => {
        const newExpense = new Expense(data);
        const saved = await newExpense.save();
        return saved;
    },

    // Get all expenses for a group
    getByGroupId: async (groupId) => {
        return await Expense.find({ groupId: groupId }).sort({ createdAt: -1 });
    },

    // Get a single expense by ID
    getById: async (expenseId) => {
        return await Expense.findById(expenseId);
    },

    // Update an expense
    update: async (expenseId, data) => {
        const updated = await Expense.findByIdAndUpdate(expenseId, data, { new: true });
        return updated;
    },

    // Delete an expense
    delete: async (expenseId) => {
        return await Expense.findByIdAndDelete(expenseId);
    },

    // Get group details with members
    getGroupById: async (groupId) => {
        return await Group.findById(groupId);
    },

    // Calculate balance summary for a group
    getGroupSummary: async (groupId) => {
        const expenses = await Expense.find({ groupId: groupId, isSettled: false });
        const group = await Group.findById(groupId);
        
        if (!group) return null;

        // Initialize balance for all members
        const balances = {};
        group.membersEmail.forEach(email => {
            balances[email] = 0;
        });

        // Calculate balances based on expenses
        expenses.forEach(expense => {
            const paidBy = expense.paidBy;
            
            expense.splitDetails.forEach(split => {
                if (split.memberEmail !== paidBy) {
                    // This member owes money to the payer
                    balances[split.memberEmail] = (balances[split.memberEmail] || 0) - split.amount;
                    // The payer is owed money
                    balances[paidBy] = (balances[paidBy] || 0) + split.amount;
                }
            });
        });

        return balances;
    },

    // Settle all expenses in a group
    settleGroup: async (groupId) => {
        // Mark all expenses as settled
        await Expense.updateMany(
            { groupId: groupId, isSettled: false },
            { $set: { isSettled: true } }
        );

        // Update group payment status
        await Group.findByIdAndUpdate(groupId, {
            paymentStatus: {
                amount: 0,
                currency: 'INR',
                date: Date.now(),
                isPaid: true
            }
        });

        return { settled: true };
    },

    // Get paginated expenses for a group
    getExpensesPaginated: async (groupId, limit, skip, sortOptions = { createdAt: -1 }) => {
        const [expenses, totalCount] = await Promise.all([
            Expense.find({ groupId: groupId })
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            Expense.countDocuments({ groupId: groupId })
        ]);

        return { expenses, totalCount };
    }
};

module.exports = expenseDao;
