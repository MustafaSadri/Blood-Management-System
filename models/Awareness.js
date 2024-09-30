const mongoose = require('mongoose');

const AwarenessSchema = new mongoose.Schema({
    message: String,
    videoUrl: String,
    createdAt: { type: Date, default: Date.now } // Automatically set the creation date
});



module.exports = mongoose.model('Awareness', AwarenessSchema);
