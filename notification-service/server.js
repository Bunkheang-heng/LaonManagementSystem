const express = require('express');
const { db } = require('../firebase-admin');
const { verifyToken } = require('../middleware/auth');

const app = express();
app.use(express.json());

// Send notification
app.post('/send', verifyToken, async (req, res) => {
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
        const notificationsSnapshot = await db.collection('notifications')
            .where('userId', '==', req.user.userId)
            .orderBy('createdAt', 'desc')
            .get();

        const notifications = notificationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(notifications);
    } catch (error) {
        console.error('Fetch notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
app.put('/:notificationId/read', verifyToken, async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        await db.collection('notifications').doc(notificationId).update({
            isRead: true,
            readAt: new Date()
        });

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Notification Service is running on port ${PORT}`);
}); 