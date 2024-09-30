// models/appointedCamp.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointedCampSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    campId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodCamp',
        required: true
    },
    appointedAt: {
        type: Date,
        default: Date.now
    }
});

const AppointedCamp = mongoose.model('AppointedCamp', appointedCampSchema);
module.exports = AppointedCamp;
