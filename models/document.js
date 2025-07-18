const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // patient or doctor who uploaded
    filename: { type: String, required: true },
    filepath: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
    description: { type: String },
});

module.exports = mongoose.model('Document', documentSchema);
