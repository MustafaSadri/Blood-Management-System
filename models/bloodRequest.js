// models/bloodRequest.js
const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    bloodType: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'Pending', // Default status is "Pending"
        enum: ['Pending', 'Accepted', 'Rejected'] // Status options
    },
    isEmergency: {
        type: Boolean,
        default: false
    }
});

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);
module.exports = BloodRequest;
