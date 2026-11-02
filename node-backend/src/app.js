const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');



require('dotenv').config();

const app = express();
connectDB(); // Connect to MongoDB

app.use(cookieParser());

const frontendUrl = 'http://localhost:5173' || process.env.CLIENT_URL;

app.use(cors({
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



app.use(express.json());

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/user', userRoutes);

const auditRoutes = require('./routes/auditRoutes');
app.use('/api', auditRoutes); 

const submissionRoutes = require('./routes/submissionRoutes'); // (Apne path ke hisab se check kar lena)

// 4. Mount Routes (Yahan connect hota hai!)
app.use('/api/submissions', submissionRoutes);

app.get('/', (req, res) => {
    res.json({ message: "GuardBrand AI RAG Backend Active" });
});



module.exports = app;