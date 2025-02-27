const express = require('express');
const { db } = require('../firebase-admin');
const { verifyToken } = require('../middleware/auth');
const { generateLoanId } = require('../utils/idGenerator');

const app = express();
app.use(express.json());

// Apply for loan
app.post('/apply', verifyToken, async (req, res) => {
    try {
        const { amount, purpose } = req.body;
        const loanId = await generateLoanId(); // Will return LOAN001, LOAN002, etc.
        
        await db.collection('loans').doc(loanId).set({
            userId: req.user.userId,
            amount,
            purpose,
            status: 'PENDING',
            createdAt: new Date()
        });

        res.status(201).json({ 
            message: 'Loan application submitted successfully',
            loanId
        });
    } catch (error) {
        console.error('Loan application error:', error);
        res.status(500).json({ error: 'Failed to submit loan application' });
    }
});

// Get user's loans
app.get('/my-loans', verifyToken, async (req, res) => {
    try {
        const loansSnapshot = await db.collection('loans')
            .where('userId', '==', req.user.userId)
            .get();

        const loans = loansSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(loans);
    } catch (error) {
        console.error('Fetch loans error:', error);
        res.status(500).json({ error: 'Failed to fetch loans' });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Loan Service is running on port ${PORT}`);
}); 