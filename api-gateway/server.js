const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');

const app = express();

app.use(cors());
app.use(express.json());

// Route to different services
app.use('/auth', proxy('http://localhost:3001'));
app.use('/loan', proxy('http://localhost:3002'));
app.use('/admin', proxy('http://localhost:3003'));
app.use('/notifications', proxy('http://localhost:3004'));
app.use('/payments', proxy('http://localhost:3005'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
}); 