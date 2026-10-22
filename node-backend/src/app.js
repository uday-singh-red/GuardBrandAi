const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

require('dotenv').config();

const app = express();
connectDB(); // Connect to MongoDB

app.use(cors());
app.use(express.json());

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
    res.json({ message: "GuardBrand AI RAG Backend Active" });
});

module.exports = app;