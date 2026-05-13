const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { expensesDb, sheetsDb } = require('../models/db');

// All expense routes require authentication
router.use(authMiddleware);

// Get expenses for a specific sheet
router.get('/', async (req, res) => {
    try {
        const { sheetId } = req.query;
        if (!sheetId) {
            return res.status(400).json({ message: "sheetId query parameter is required" });
        }

        // Verify the user owns the sheet
        const sheet = await sheetsDb.findOne({ _id: sheetId, userId: req.user.id });
        if (!sheet) {
            return res.status(403).json({ message: "Access denied or sheet not found" });
        }

        const expenses = await expensesDb.find({ sheetId }).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Add a new expense
router.post('/', async (req, res) => {
    try {
        const { sheetId, description, amount, category, date } = req.body;
        
        if (!sheetId || !description || amount === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Verify the user owns the sheet
        const sheet = await sheetsDb.findOne({ _id: sheetId, userId: req.user.id });
        if (!sheet) {
            return res.status(403).json({ message: "Access denied or sheet not found" });
        }

        const newExpense = await expensesDb.insert({
            sheetId,
            description,
            amount: Number(amount),
            category: category || 'Uncategorized',
            date: date || new Date().toISOString(),
            createdAt: new Date()
        });

        res.status(201).json(newExpense);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Update an expense
router.put('/:id', async (req, res) => {
    try {
        const expenseId = req.params.id;
        const { description, amount, category, date } = req.body;

        const expense = await expensesDb.findOne({ _id: expenseId });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        // Verify the user owns the sheet this expense belongs to
        const sheet = await sheetsDb.findOne({ _id: expense.sheetId, userId: req.user.id });
        if (!sheet) {
            return res.status(403).json({ message: "Access denied" });
        }

        const updatedExpense = await expensesDb.update(
            { _id: expenseId },
            { $set: { description, amount: Number(amount), category, date } },
            { returnUpdatedDocs: true }
        );

        // nedb-promises update with returnUpdatedDocs returns the number of affected docs and the doc itself
        // if using plain nedb it's a bit different, but nedb-promises handles it
        // Wait, nedb-promises returns the number of affected docs if returnUpdatedDocs is not used. 
        // With returnUpdatedDocs: true, it returns the doc(s) in some cases or we can just find it again.
        // Let's just find it to be safe.
        
        const newlyUpdated = await expensesDb.findOne({ _id: expenseId });

        res.json(newlyUpdated);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
    try {
        const expenseId = req.params.id;
        
        const expense = await expensesDb.findOne({ _id: expenseId });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        // Verify the user owns the sheet this expense belongs to
        const sheet = await sheetsDb.findOne({ _id: expense.sheetId, userId: req.user.id });
        if (!sheet) {
            return res.status(403).json({ message: "Access denied" });
        }

        await expensesDb.remove({ _id: expenseId });
        res.json({ message: "Expense deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
