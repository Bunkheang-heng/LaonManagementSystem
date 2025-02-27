const express = require('express');
const { db } = require('../firebase-admin');
const { verifyToken } = require('../middleware/auth');
const { generatePaymentId } = require('../utils/idGenerator');

const app = express();
app.use(express.json());

// Process payment
app.post('/process', verifyToken, async (req, res) => {
    try {
        const { loanId, amount, paymentMethod } = req.body;
        const paymentId = await generatePaymentId(); // Will return PAY001, PAY002, etc.
        
        // Get loan details
        const loanDoc = await db.collection('loans').doc(loanId).get();
        if (!loanDoc.exists) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        // Create payment record with custom ID
        await db.collection('payments').doc(paymentId).set({
            loanId,
            userId: req.user.userId,
            amount,
            paymentMethod,
            status: 'COMPLETED',
            createdAt: new Date()
        });

        // Update loan balance
        await db.collection('loans').doc(loanId).update({
            lastPaymentDate: new Date(),
            lastPaymentAmount: amount
        });

        res.status(201).json({ 
            message: 'Payment processed successfully',
            paymentId
        });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
});

// Get payment history
app.get('/history', verifyToken, async (req, res) => {
    try {
        const paymentsSnapshot = await db.collection('payments')
            .where('userId', '==', req.user.userId)
            .orderBy('createdAt', 'desc')
            .get();

        const payments = paymentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(payments);
    } catch (error) {
        console.error('Fetch payment history error:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

// Get payment details
app.get('/:paymentId', verifyToken, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const paymentDoc = await db.collection('payments').doc(paymentId).get();
        
        if (!paymentDoc.exists) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({
            id: paymentDoc.id,
            ...paymentDoc.data()
        });
    } catch (error) {
        console.error('Fetch payment details error:', error);
        res.status(500).json({ error: 'Failed to fetch payment details' });
    }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Payment Service is running on port ${PORT}`);
}); 