const express = require('express');
const { db } = require('../firebase-admin');
const { verifyAdmin } = require('../middleware/auth');

const app = express();
app.use(express.json());

// Get all loan applications
app.get('/loans', verifyAdmin, async (req, res) => {
    try {
        const loansSnapshot = await db.collection('loans').get();
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

// Update loan status
app.put('/loans/:loanId', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const { loanId } = req.params;

        await db.collection('loans').doc(loanId).update({ 
            status,
            updatedAt: new Date()
        });

        res.json({ message: 'Loan status updated successfully' });
    } catch (error) {
        console.error('Update loan status error:', error);
        res.status(500).json({ error: 'Failed to update loan status' });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Admin Service is running on port ${PORT}`);
}); 