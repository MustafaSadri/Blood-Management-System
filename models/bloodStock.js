const mongoose = require('mongoose');

const bloodStockSchema = new mongoose.Schema({
    bloodType: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] // Blood types
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

const BloodStock = mongoose.model('BloodStock', bloodStockSchema);

module.exports = BloodStock;
