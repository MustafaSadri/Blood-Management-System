const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');

async function seedHospitals() {
    await mongoose.connect('mongodb://127.0.0.1:27017/blood-donation');

    const hospitals = [
        { name: 'City Hospital', location: 'Downtown', email: 'city@example.com', password: 'password123' },
        { name: 'Greenwood Hospital', location: 'Greenwood', email: 'greenwood@example.com', password: 'password123' }
    ];

    await Hospital.deleteMany({}); // Clear existing data
    await Hospital.insertMany(hospitals);

    console.log('Hospitals data seeded');
    mongoose.connection.close();
}

seedHospitals().catch(err => console.error(err));
