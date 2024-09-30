// models/bloodCamp.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bloodCampSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: false
    }
});

const BloodCamp = mongoose.model('BloodCamp', bloodCampSchema);
module.exports = BloodCamp;
