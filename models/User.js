// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    password: { type: String, required: true },

    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient',
    },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending', // For doctors needing approval
    },

    profilePicUrl: { type: String }, // URL to profile picture

    about: { type: String }, // 

    contactNumber: { type: String }, // Optional phone or contact

    createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
