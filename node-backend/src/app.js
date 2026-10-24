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

const auditRoutes = require('./routes/auditRoutes');
app.use('/api', auditRoutes); 

const submissionRoutes = require('./routes/submissionRoutes'); // (Apne path ke hisab se check kar lena)

// 4. Mount Routes (Yahan connect hota hai!)
app.use('/api/submissions', submissionRoutes);

app.get('/', (req, res) => {
    res.json({ message: "GuardBrand AI RAG Backend Active" });
});



module.exports = app;