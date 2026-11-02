const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  try {
    // 1. cookieParser ki madad se req.cookies se token nikalna
    const token = req.cookies.token;

    // 2. Agar token hi nahi hai, matlab user logged in nahi hai
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authorized, no token found in cookies." 
      });
    }

    // 3. Token ko verify karna (Secret key match karna aur expiry check karna)
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback_secret_key'
    );

    // 4. Decoded user data ko request object mein daal dena taaki protected route mein use ho sake
    req.user = decoded; // Isme { userId, email } hoga jo aapne sign karte waqt diya tha

    // 5. Sab theek hai, toh aage bhej do (controller ki taraf)
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ 
      success: false, 
      message: "Not authorized, token failed or expired." 
    });
  }
};

module.exports = { protect };