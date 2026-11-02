// src/controllers/userController.js
const { parseUserInput } = require('../utils/inputParser');
const { findRelevantGuidelines } = require('../services/searchService');

const { User } = require('../models/userSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Helper: Secure Cookie Options Configuration
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true, // XSS attacks se bachane ke liye (JavaScript se access nahi hogi)
  secure: isProduction, // Localhost par false (http), Vercel/Production par true (https)
  sameSite: isProduction ? 'none' : 'lax', // Cross-origin ke liye 'none' zaroori hai jab frontend/backend alag domain par hon
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days in milliseconds
};


exports.auditUserContent = async (req, res) => {
    try {
        // Step 1: Parse input (Text, .txt file, or PDF)
        const userText = await parseUserInput(req);

        // Step 2: Vector search se relevant guidelines dhoondho
        const matchedGuidelines = await findRelevantGuidelines(userText);

        if (matchedGuidelines.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No matching company guidelines found in the database.',
                matchedGuidelines: [],
                verdict: 'APPROVED (No rules found to compare)'
            });
        }

        // TODO: Step 3 mein yahan Gemini LLM call karenge jo matchedGuidelines aur userText ko compare karega

        return res.status(200).json({
            success: true,
            userTextPreview: userText.slice(0, 150) + '...', // Preview ke liye
            matchedGuidelines: matchedGuidelines
        });

    } catch (error) {
        console.error('❌ Audit Controller Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};


// Helper: Email format validation regex
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ==========================================
// 1. REGISTER USER & SEND OTP
// ==========================================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // --- Validation Checks ---
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please fill in all fields (name, email, password)." });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters long." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }

    if (password.length <= 7) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    // --- Check Existing User ---
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ success: false, message: "User with this email already exists." });
      } else {
        await User.deleteOne({ _id: existingUser._id });
      }
    }

    // --- Password Hashing ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Generate 6-Digit Cryptographic OTP & 3 Min Expiry ---
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    // --- Create Unverified User Document ---
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpires
    });

    await newUser.save();

    // --- Send Email with OTP ---
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Welcome to GuardBrand AI! 🚀</h2>
        <p>Hi <b>${name}</b>,</p>
        <p>Thank you for signing up. Please use the following 6-digit OTP to verify your email address:</p>
        <h1 style="background-color: #F3F4F6; padding: 10px 20px; display: inline-block; letter-spacing: 4px; color: #1F2937;">${otp}</h1>
        <p style="color: #6B7280; font-size: 14px;">This OTP is valid for 3 minutes only.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      email: newUser.email,
      subject: "GuardBrand AI - Email Verification OTP",
      message: emailHtml
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! Verification OTP sent to your email.",
      userId: newUser._id,
      email: newUser.email
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Server error during registration.", error: error.message });
  }
};

// ==========================================
// 2. VERIFY OTP & COMPLETE REGISTRATION (Auto-Login via Cookie)
// ==========================================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Account is already verified. Please login." });
    }

    // Check OTP Match & Expiry
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP code provided." });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate JWT Access Token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    // Set Token in Secure Cookie (Auto-login after verification)
    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ success: false, message: "Server error during OTP verification." });
  }
};

// ==========================================
// 3. LOGIN USER (Via Cookie)
// ==========================================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Validation Checks ---
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide both email and password." });
    }

    // --- Find User by Email ---
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // --- Check if Account is Verified via OTP ---
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: "Account is not verified. Please verify your OTP first.",
        email: user.email 
      });
    }

    // --- Compare Password with Hashed Password ---
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // --- Generate JWT Access Token ---
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    // --- Set Token in Secure Cookie ---
    res.cookie('token', token, cookieOptions);

    // --- Send Success Response ---
    res.status(200).json({
      success: true,
      message: "Login successful!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error during login.", error: error.message });
  }
};

// ==========================================
// 4. RESEND OTP
// ==========================================
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Account is already verified." });
    }

    // Generate new OTP & update expiration
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = newOtp;
    user.otpExpires = new Date(Date.now() + 3 * 60 * 1000);
    await user.save();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Resend OTP - GuardBrand AI</h2>
        <p>Your new verification OTP code is:</p>
        <h1 style="background-color: #F3F4F6; padding: 10px 20px; display: inline-block;">${newOtp}</h1>
        <p>This code will expire in 3 minutes.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: "GuardBrand AI - Resent Email Verification OTP",
      message: emailHtml
    });

    res.status(200).json({ success: true, message: "New OTP has been sent to your email." });

  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ success: false, message: "Server error while resending OTP." });
  }
};