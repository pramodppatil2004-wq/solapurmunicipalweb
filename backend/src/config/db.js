const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let isConnected = false;

async function seedInitialMongoData() {
  try {
    const Grievance = require('../models/mongo/Grievance');
    const Citizen = require('../models/mongo/Citizen');
    const Admin = require('../models/mongo/Admin');

    const dataDir = path.join(__dirname, '..', 'data');

    // 1. Seed Grievances if collection is empty
    const grievanceCount = await Grievance.countDocuments();
    if (grievanceCount === 0) {
      const grievancesFile = path.join(dataDir, 'grievances.json');
      const seedFile = path.join(dataDir, 'seedData.json');
      const filePath = fs.existsSync(grievancesFile) ? grievancesFile : seedFile;

      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const items = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          // Format id to string if needed
          const docs = items.map(g => ({
            ...g,
            id: String(g.id || Date.now())
          }));
          await Grievance.insertMany(docs);
          console.log(`  🌱 Seeded ${docs.length} Solapur grievances into MongoDB collection.`);
        }
      }
    }

    // 2. Seed Citizen if collection is empty
    const citizenCount = await Citizen.countDocuments();
    if (citizenCount === 0) {
      const citizensFile = path.join(dataDir, 'citizens.json');
      if (fs.existsSync(citizensFile)) {
        const raw = fs.readFileSync(citizensFile, 'utf8');
        const citizens = JSON.parse(raw);
        if (Array.isArray(citizens) && citizens.length > 0) {
          await Citizen.insertMany(citizens.map(c => ({
            citizenId: c.id,
            fullName: c.fullName,
            mobileNumber: c.mobileNumber,
            email: c.email || '',
            ward: c.ward || '',
            address: c.address || '',
            passwordHash: c.passwordHash
          })));
          console.log(`  🌱 Seeded ${citizens.length} registered citizens into MongoDB collection.`);
        }
      }
    }

    // 3. Seed Single Admin if collection is empty
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const officersFile = path.join(dataDir, 'officers.json');
      if (fs.existsSync(officersFile)) {
        const raw = fs.readFileSync(officersFile, 'utf8');
        const officers = JSON.parse(raw);
        if (Array.isArray(officers) && officers.length > 0) {
          await Admin.insertMany(officers.map(o => ({
            employeeId: o.employeeId || 'SMC-ADMIN-01',
            fullName: o.fullName || 'Shri. A. K. Patil',
            designation: o.designation || 'Municipal Grievance Administrator',
            department: o.department || 'Central Administration',
            role: o.role || 'Single Administrator',
            username: o.username || 'admin',
            email: o.email || 'admin@solapurcorporation.gov.in',
            mobileNumber: o.mobileNumber || '9422011223',
            passwordHash: o.passwordHash
          })));
          console.log(`  🌱 Seeded single municipal administrator into MongoDB collection.`);
        }
      }
    }
  } catch (err) {
    console.warn('  ⚠️ Initial MongoDB data seeding encountered a minor issue:', err.message);
  }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/solapur_grievances';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000, // fast timeout for local check
      autoIndex: true
    });

    isConnected = true;
    const host = conn.connection.host || '127.0.0.1';
    const dbName = conn.connection.name || 'solapur_grievances';

    console.log('------------------------------------------------------------------');
    console.log(`  🍃 MongoDB Database Connected: [${host}/${dbName}]`);
    console.log('------------------------------------------------------------------');

    // Run auto-seeder
    await seedInitialMongoData();

    return conn;
  } catch (error) {
    isConnected = false;
    console.log('------------------------------------------------------------------');
    console.warn(`  ⚠️ MongoDB connection failed: ${error.message}`);
    console.warn('  🔄 Fallback activated: Running in resilient JSON store mode.');
    console.warn('  💡 Tip: Ensure MongoDB service is running (mongod) or configure');
    console.warn('     MONGODB_URI in backend/.env with your MongoDB Atlas connection string.');
    console.log('------------------------------------------------------------------');
    return null;
  }
}

function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  isMongoConnected,
  mongoose
};
