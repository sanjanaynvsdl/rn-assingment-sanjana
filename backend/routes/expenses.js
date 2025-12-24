const express = require('express');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const router = express.Router();

// add expense
router.post('/', auth, async (req, res) => {
    try {
        const { amount, category, paymentMethod, description, date, localId } = req.body;

        if (!amount || !category || !paymentMethod) {
            return res.status(400).json({ message: 'Amount, category and payment method are required' });
        }

        const expense = new Expense({
            user: req.userId,
            amount,
            category,
            paymentMethod,
            description,
            date: date || new Date(),
            localId
        });

        await expense.save();
        res.status(201).json({ message: 'Expense added', expense });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// get all expenses with filters
router.get('/', auth, async (req, res) => {
    try {
        const { category, startDate, endDate, page = 1, limit = 20 } = req.query;
        const query = { user: req.userId };

        if (category) {
            query.category = category;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const expenses = await Expense.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Expense.countDocuments(query);

        res.json({
            expenses,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// get expense by id
router.get('/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findOne({ _id: req.params.id, user: req.userId });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json({ expense });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// update expense
router.put('/:id', auth, async (req, res) => {
    try {
        const { amount, category, paymentMethod, description, date } = req.body;

        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            { amount, category, paymentMethod, description, date },
            { new: true }
        );

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json({ message: 'Expense updated', expense });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// delete expense
router.delete('/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.userId });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// get daily expenses
router.get('/stats/daily', auth, async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const expenses = await Expense.find({
            user: req.userId,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ date: -1 });

        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        res.json({ expenses, total, date: startOfDay });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// get monthly expenses
router.get('/stats/monthly', auth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        const expenses = await Expense.find({
            user: req.userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ date: -1 });

        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        const byCategory = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {});

        res.json({ expenses, total, byCategory, month: targetMonth + 1, year: targetYear });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// get category breakdown
router.get('/stats/categories', auth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        const breakdown = await Expense.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.userId),
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        const total = breakdown.reduce((sum, cat) => sum + cat.total, 0);

        res.json({ breakdown, total, month: targetMonth + 1, year: targetYear });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// get insights
router.get('/stats/insights', auth, async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentStart = new Date(currentYear, currentMonth, 1);
        const currentEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        const lastStart = new Date(lastMonthYear, lastMonth, 1);
        const lastEnd = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59);

        const userObjectId = new mongoose.Types.ObjectId(req.userId);

        const currentMonthData = await Expense.aggregate([
            { $match: { user: userObjectId, date: { $gte: currentStart, $lte: currentEnd } } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);

        const lastMonthData = await Expense.aggregate([
            { $match: { user: userObjectId, date: { $gte: lastStart, $lte: lastEnd } } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);

        const lastMonthMap = {};
        lastMonthData.forEach(item => { lastMonthMap[item._id] = item.total; });

        const insights = [];
        let currentTotal = 0;
        let lastTotal = 0;

        currentMonthData.forEach(item => {
            currentTotal += item.total;
            const lastAmount = lastMonthMap[item._id] || 0;
            lastTotal += lastAmount;

            if (lastAmount > 0) {
                const change = ((item.total - lastAmount) / lastAmount) * 100;
                if (Math.abs(change) >= 10) {
                    insights.push({
                        category: item._id,
                        currentAmount: item.total,
                        lastAmount: lastAmount,
                        changePercent: Math.round(change),
                        message: change > 0
                            ? `You spent ${Math.round(change)}% more on ${item._id} this month`
                            : `You spent ${Math.abs(Math.round(change))}% less on ${item._id} this month`
                    });
                }
            }
        });

        const overallChange = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

        res.json({
            insights,
            currentMonthTotal: currentTotal,
            lastMonthTotal: lastTotal,
            overallChange: Math.round(overallChange)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// sync offline expenses
router.post('/sync', auth, async (req, res) => {
    try {
        const { expenses } = req.body;

        if (!expenses || !Array.isArray(expenses)) {
            return res.status(400).json({ message: 'Expenses array is required' });
        }

        const synced = [];
        for (const exp of expenses) {
            const existing = await Expense.findOne({ localId: exp.localId, user: req.userId });

            if (existing) {
                const updated = await Expense.findByIdAndUpdate(
                    existing._id,
                    { ...exp, syncStatus: 'synced' },
                    { new: true }
                );
                synced.push(updated);
            } else {
                const newExp = new Expense({
                    ...exp,
                    user: req.userId,
                    syncStatus: 'synced'
                });
                await newExp.save();
                synced.push(newExp);
            }
        }

        res.json({ message: 'Sync complete', synced });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
