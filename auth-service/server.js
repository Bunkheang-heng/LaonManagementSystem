const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../firebase-admin');
const { generateUserId } = require('../utils/idGenerator');

const app = express();
app.use(express.json());

// Register endpoint
app.post('/register', async (req, res) => {
    try {
        const { username, password, role = 'user' } = req.body;
        const userId = await generateUserId(); // Will return USER001, USER002, etc.
        
        // Check if user already exists
        const userDoc = await db.collection('users').where('username', '==', username).get();
        if (!userDoc.empty) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user with custom ID
        await db.collection('users').doc(userId).set({
            username,
            password: hashedPassword,
            role,
            createdAt: new Date()
        });

        res.status(201).json({ 
            message: 'User registered successfully',
            userId 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const userSnapshot = await db.collection('users')
            .where('username', '==', username)
            .get();

        if (userSnapshot.empty) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        
        const validPassword = await bcrypt.compare(password, userData.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { 
                userId: userDoc.id, 
                role: userData.role 
            },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
}); 