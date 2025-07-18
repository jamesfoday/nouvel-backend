const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/prescription');
const upload = require('../middleware/upload');
const User = require('../models/User');
const sendEmail = require('../utils/email');
const PDFDocument = require('pdfkit');


router.use(authenticateToken, authorizeRoles(['patient']));

// Book a consultation
router.post('/consultations', async (req, res) => {
    try {
        const { doctor, date, reason } = req.body;

        const consultation = new Consultation({
            patient: req.user.id,
            doctor,
            date,
            reason,
        });

        await consultation.save();

        // Fetch patient and doctor emails for notification
        const patientUser = await User.findById(req.user.id);
        const doctorUser = await User.findById(doctor);

        // Send confirmation emails
        await sendEmail(patientUser.email, 'Appointment Confirmed', `Your appointment on ${date} is confirmed.`);
        await sendEmail(doctorUser.email, 'New Appointment Scheduled', `You have a new appointment on ${date} with ${patientUser.name}.`);

        res.status(201).json({ message: 'Consultation booked and emails sent', consultation });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// View all consultations
router.get('/consultations', async (req, res) => {
    try {
        const consultations = await Consultation.find({ patient: req.user.id }).populate('doctor', 'name profilePicUrl');
        res.json(consultations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
    const consultations = await Consultation.find({ patient: req.user.id })
        .populate('doctor', 'name profilePicUrl email contactNumber');

});

// View prescriptions
router.get('/prescriptions', async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patient: req.user.id }).populate('doctor', 'name profilePicUrl');
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// download pdf

router.get('/prescriptions/:id/download', async (req, res) => {
    try {
        const prescription = await Prescription.findOne({ _id: req.params.id, patient: req.user.id })
            .populate('doctor', 'name');

        if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription_${prescription._id}.pdf`);

        doc.text(`Prescription for ${prescription.patient}`, { align: 'center' });
        doc.moveDown();
        doc.text(`Doctor: ${prescription.doctor.name}`);
        doc.text(`Medication: ${prescription.medication}`);
        doc.text(`Dosage: ${prescription.dosage}`);
        if (prescription.instructions) doc.text(`Instructions: ${prescription.instructions}`);

        doc.end();
        doc.pipe(res);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});



// patient route
router.get('/profile', (req, res) => {
    res.json({
        message: `Hello Patient ${req.user.name}, this is your profile page.`,
        user: req.user,
    });
});

// Upload profile picture
router.post('/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.user.id;
        const profilePicUrl = req.file.path;

        // Update user profilePicUrl
        await User.findByIdAndUpdate(userId, { profilePicUrl });

        res.json({ message: 'Profile picture uploaded successfully', profilePicUrl });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


router.put('/profile', async (req, res) => {
    try {
        const updates = req.body; // expect fields like name, contactNumber, about, etc.
        const allowedUpdates = ['name', 'contactNumber', 'about', 'email'];
        const filteredUpdates = {};

        // Only allow specific fields
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


// Upload patient documents (like medical records)
const Document = require('../models/document');

// Upload patient document
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
        res.status(500).json({ message: 'Server error' });
    }
});

// List documents uploaded by patient
router.get('/documents', async (req, res) => {
    try {
        const documents = await Document.find({ owner: req.user.id });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;



