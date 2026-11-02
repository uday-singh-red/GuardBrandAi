const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const app = express();
connectDB(); // Connect to MongoDB

app.use(cookieParser());

// Whitelist allowed origins (Localhost aur Vercel dono ke liye)
const allowedOrigins = [
  'http://localhost:5173',
  'https://guard-brand-ai.vercel.app',
  process.env.CLIENT_URL // Render environment variable se bhi utha lega
].filter(Boolean); // Agar koi undefined ho toh hata dega

app.use(cors({
  origin: function (origin, callback) {
    // Postman ya server-to-server requests ke liye jinka origin nahi hota
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy violation: This origin is not allowed.'), false);
    }
    return callback(null, true);
  },
  credentials: true, // Cookies aur credentials ke liye bohot zaroori hai
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