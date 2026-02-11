const expenseDao = require('../dao/expenseDao');

const expenseController = {
    // Create a new expense
    create: async (req, resp) => {
        try {
            const user = req.user;
            const { groupId, title, description, totalAmount, splitDetails } = req.body;

            // Validation
            if (!groupId || !title || !totalAmount || !splitDetails) {
                return resp.status(400).json({ message: "Group ID, title, total amount, and split details are required" });
            }

            if (!Array.isArray(splitDetails) || splitDetails.length === 0) {
                return resp.status(400).json({ message: "Split details must be a non-empty array" });
            }

            // Verify group exists and user is a member
            const group = await expenseDao.getGroupById(groupId);
            if (!group) {
                return resp.status(404).json({ message: "Group not found" });
            }

            if (!group.membersEmail.includes(user.email)) {
                return resp.status(403).json({ message: "You are not a member of this group" });
            }

            // Validate split amounts add up to total
            const splitTotal = splitDetails.reduce((sum, split) => sum + split.amount, 0);
            if (Math.abs(splitTotal - totalAmount) > 0.01) {
                return resp.status(400).json({ message: "Split amounts must equal the total amount" });
            }

            const newExpense = await expenseDao.create({
                groupId,
                title,
                description,
                totalAmount,
                paidBy: user.email,
                splitDetails
            });

            return resp.status(201).json({ message: "Expense created successfully", expense: newExpense });
        }
        catch (err) {
            console.log("Error creating expense", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Get all expenses for a group
    getByGroup: async (req, resp) => {
        try {
            const { groupId } = req.params;
            const user = req.user;

            if (!groupId) {
                return resp.status(400).json({ message: "Group ID is required" });
            }

            // Verify user is a member of the group
            const group = await expenseDao.getGroupById(groupId);
            if (!group) {
                return resp.status(404).json({ message: "Group not found" });
            }

            if (!group.membersEmail.includes(user.email)) {
                return resp.status(403).json({ message: "You are not a member of this group" });
            }

            const expenses = await expenseDao.getByGroupId(groupId);
            return resp.status(200).json({ expenses, group });
        }
        catch (err) {
            console.log("Error fetching expenses", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Get group summary (balances)
    getSummary: async (req, resp) => {
        try {
            const { groupId } = req.params;
            const user = req.user;

            if (!groupId) {
                return resp.status(400).json({ message: "Group ID is required" });
            }

            // Verify user is a member of the group
            const group = await expenseDao.getGroupById(groupId);
            if (!group) {
                return resp.status(404).json({ message: "Group not found" });
            }

            if (!group.membersEmail.includes(user.email)) {
                return resp.status(403).json({ message: "You are not a member of this group" });
            }

            const balances = await expenseDao.getGroupSummary(groupId);
            return resp.status(200).json({ balances, groupName: group.name });
        }
        catch (err) {
            console.log("Error fetching summary", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Settle group - mark all expenses as settled
    settleGroup: async (req, resp) => {
        try {
            const { groupId } = req.params;
            const user = req.user;

            if (!groupId) {
                return resp.status(400).json({ message: "Group ID is required" });
            }

            // Verify group exists
            const group = await expenseDao.getGroupById(groupId);
            if (!group) {
                return resp.status(404).json({ message: "Group not found" });
            }

            // Only admin can settle the group
            if (group.adminEmail !== user.email) {
                return resp.status(403).json({ message: "Only group admin can settle the group" });
            }

            await expenseDao.settleGroup(groupId);
            return resp.status(200).json({ message: "Group settled successfully" });
        }
        catch (err) {
            console.log("Error settling group", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Update an expense
    update: async (req, resp) => {
        try {
            const { expenseId, title, description, totalAmount, splitDetails } = req.body;
            const user = req.user;

            if (!expenseId) {
                return resp.status(400).json({ message: "Expense ID is required" });
            }

            const expense = await expenseDao.getById(expenseId);
            if (!expense) {
                return resp.status(404).json({ message: "Expense not found" });
            }

            // Only the creator can update the expense
            if (expense.paidBy !== user.email) {
                return resp.status(403).json({ message: "Only the expense creator can update it" });
            }

            const updated = await expenseDao.update(expenseId, {
                title,
                description,
                totalAmount,
                splitDetails
            });

            return resp.status(200).json({ message: "Expense updated successfully", expense: updated });
        }
        catch (err) {
            console.log("Error updating expense", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Delete an expense
    delete: async (req, resp) => {
        try {
            const { expenseId } = req.params;
            const user = req.user;

            if (!expenseId) {
                return resp.status(400).json({ message: "Expense ID is required" });
            }

            const expense = await expenseDao.getById(expenseId);
            if (!expense) {
                return resp.status(404).json({ message: "Expense not found" });
            }

            // Only the creator can delete the expense
            if (expense.paidBy !== user.email) {
                return resp.status(403).json({ message: "Only the expense creator can delete it" });
            }

            await expenseDao.delete(expenseId);
            return resp.status(200).json({ message: "Expense deleted successfully" });
        }
        catch (err) {
            console.log("Error deleting expense", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    }
};

module.exports = expenseController;
