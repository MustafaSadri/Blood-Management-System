// init/adminSeeder.js
const mongoose = require('mongoose');
const Admin = require('../models/admin');

async function seedAdmins() {
    await mongoose.connect('mongodb://127.0.0.1:27017/blood-donation');
    
    const admins = [
        { username: 'Admin1', email: 'admin1@example.com', password: 'admin123' },
        { username: 'Admin2', email: 'admin2@example.com', password: 'admin123' },
        { username: 'Admin3', email: 'admin3@example.com', password: 'admin123' },
    ];

    await Admin.insertMany(admins);
    console.log('Admins seeded');
    mongoose.connection.close();
}

seedAdmins();
