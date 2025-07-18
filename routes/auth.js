// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Secret for JWT - in .env
const JWT_SECRET = process.env.JWT_SECRET;

// Register new user
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    // validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // For doctor registrations, status is pending; patients and admin approved by default
        let status = 'approved';
        if (role === 'doctor') status = 'pending';

        // Create user
        const newUser = new User({ name, email, password, role, status });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully. Doctor accounts require admin approval.' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if doctor is approved
        if (user.role === 'doctor' && user.status !== 'approved') {
            return res.status(403).json({ message: 'Doctor account is not approved yet' });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT payload
        const payload = {
            id: user._id,
            role: user.role,
            name: user.name,
            email: user.email,
        };

        // Sign token
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: payload });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
