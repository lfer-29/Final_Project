const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { sheetsDb, expensesDb } = require('../models/db');

// All sheet routes require authentication
router.use(authMiddleware);

// Get all sheets for the logged-in user
router.get('/', async (req, res) => {
    try {
        const sheets = await sheetsDb.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(sheets);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Create a new sheet
router.post('/', async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ message: "Sheet title is required" });
        }

        const newSheet = await sheetsDb.insert({
            userId: req.user.id,
            title,
            createdAt: new Date()
        });
        res.status(201).json(newSheet);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Delete a sheet
router.delete('/:id', async (req, res) => {
    try {
        const sheetId = req.params.id;
        const sheet = await sheetsDb.findOne({ _id: sheetId, userId: req.user.id });
        
        if (!sheet) {
            return res.status(404).json({ message: "Sheet not found" });
        }

        await sheetsDb.remove({ _id: sheetId });
        // Optionally delete all expenses associated with this sheet
        await expensesDb.remove({ sheetId: sheetId }, { multi: true });
        
        res.json({ message: "Sheet deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
