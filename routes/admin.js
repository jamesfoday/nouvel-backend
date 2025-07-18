const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');

router.use(authenticateToken, authorizeRoles(['admin']));

router.get('/overview', (req, res) => {
    res.json({
        message: `Hello Admin ${req.user.name}, this is your overview page.`,
        user: req.user,
    });
});

// Get all users (patients and doctors)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); // exclude passwords
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Get all doctors with status pending (for approval)
router.get('/doctors/pending', async (req, res) => {
    try {
        const pendingDoctors = await User.find({ role: 'doctor', status: 'pending' }).select('-password');
        res.json(pendingDoctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve a doctor by ID
router.patch('/doctors/approve/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        const doctor = await User.findById(doctorId);

        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        doctor.status = 'approved';
        await doctor.save();

        res.json({ message: `Doctor ${doctor.name} approved successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject a doctor by ID
router.patch('/doctors/reject/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        const doctor = await User.findById(doctorId);

        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        doctor.status = 'rejected';
        await doctor.save();

        res.json({ message: `Doctor ${doctor.name} rejected successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;




