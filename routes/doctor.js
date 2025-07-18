const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/prescription');
const User = require('../models/User');
const Document = require('../models/document');
const upload = require('../middleware/upload');

router.use(authenticateToken, authorizeRoles(['doctor']));

// Doctor dashboard info
router.get('/dashboard', (req, res) => {
    res.json({
        message: `Hello Doctor ${req.user.name}, this is your dashboard.`,
        user: req.user,
    });
});

// Upload doctor profile picture
router.post('/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const userId = req.user.id;
        const profilePicUrl = req.file.path;

        await User.findByIdAndUpdate(userId, { profilePicUrl });

        res.json({ message: 'Profile picture uploaded successfully', profilePicUrl });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// upate profile 
router.put('/profile', async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['name', 'contactNumber', 'about', 'email', 'specialization'];
        const filteredUpdates = {};

        for (const key of allowedUpdates) {
            if (updates[key]) filteredUpdates[key] = updates[key];
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredUpdates, { new: true });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Update consultation status (confirm, cancel, complete)
router.patch('/consultations/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const consultation = await Consultation.findOne({ _id: req.params.id, doctor: req.user.id });
        if (!consultation) {
            return res.status(404).json({ message: 'Consultation not found' });
        }

        consultation.status = status;
        await consultation.save();

        res.json({ message: `Consultation status updated to ${status}`, consultation });
    } catch (error) {
        console.error('Error updating consultation status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// View all consultations assigned to this doctor
router.get('/consultations', async (req, res) => {
    try {
        const consultations = await Consultation.find({ doctor: req.user.id })
            .populate('patient', 'name profilePicUrl email contactNumber');
        res.json(consultations);
    } catch (error) {
        console.error('Error fetching consultations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a prescription for a patient
router.post('/prescriptions', async (req, res) => {
    try {
        const { patient, medication, dosage, instructions } = req.body;
        if (!patient || !medication || !dosage) {
            return res.status(400).json({ message: 'Please provide patient, medication, and dosage' });
        }

        const prescription = new Prescription({
            doctor: req.user.id,
            patient,
            medication,
            dosage,
            instructions,
        });

        await prescription.save();
        res.status(201).json({ message: 'Prescription created', prescription });
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// View all prescriptions issued by this doctor
router.get('/prescriptions', async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ doctor: req.user.id })
            .populate('patient', 'name profilePicUrl email contactNumber');
        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update prescription
router.patch('/prescriptions/:id', async (req, res) => {
    try {
        const { medication, dosage, instructions } = req.body;

        const prescription = await Prescription.findOne({ _id: req.params.id, doctor: req.user.id });
        if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

        if (medication) prescription.medication = medication;
        if (dosage) prescription.dosage = dosage;
        if (instructions) prescription.instructions = instructions;

        await prescription.save();
        res.json({ message: 'Prescription updated', prescription });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete prescription
router.delete('/prescriptions/:id', async (req, res) => {
    try {
        const prescription = await Prescription.findOneAndDelete({ _id: req.params.id, doctor: req.user.id });
        if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

        res.json({ message: 'Prescription deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Upload a document (e.g., certificates, reports)
router.post('/upload-document', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { filename, path: filepath, mimetype, size } = req.file;

        const document = new Document({
            owner: req.user.id,
            filename,
            filepath,
            mimetype,
            size,
            description: req.body.description || '',
        });

        await document.save();

        res.json({ message: 'Document uploaded successfully', document });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// List all documents uploaded by the doctor
router.get('/documents', async (req, res) => {
    try {
        const documents = await Document.find({ owner: req.user.id });
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
