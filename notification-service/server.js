const express = require('express');
const { db } = require('../firebase-admin');
const { verifyAdmin, verifyToken } = require('../middleware/auth');

const app = express();
app.use(express.json());

// Send notification
app.post('/send', verifyAdmin, async (req, res) => {
    try {
        const { userId, message, type } = req.body;
        
        await db.collection('notifications').add({
            userId,
            message,
            type, // 'LOAN_APPROVED', 'LOAN_REJECTED', 'PAYMENT_DUE', etc.
            isRead: false,
            createdAt: new Date()
        });

        res.status(201).json({ message: 'Notification sent successfully' });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Get user's notifications
app.get('/my-notifications', verifyToken, async (req, res) => {
    try {
        // Option A: Remove the ordering in the query
        const notificationsSnapshot = await db.collection('notifications')
            .where('userId', '==', req.user.userId)
            .get();

        // Sort the results in memory instead
        const notifications = notificationsSnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .sort((a, b) => {
                // Convert timestamps to Date objects if needed
                const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
                const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
                return dateB - dateA; // Descending order
            });

        res.json(notifications);
    } catch (error) {
        console.error('Fetch notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Notification Service is running on port ${PORT}`);
}); 