const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');

const app = express();

app.use(cors());
app.use(express.json());

// Route to different services using Docker service names
app.use('/loan', proxy('loan-service:3002'));
app.use('/admin', proxy('admin-service:3003'));
app.use('/notifications', proxy('notification-service:3004'));
app.use('/payments', proxy('payment-service:3005'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
}); 