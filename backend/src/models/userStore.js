const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isMongoConnected } = require('../config/db');
const Citizen = require('./mongo/Citizen');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'citizens.json');

// Initialize storage and seed default citizen for quick testing
function initializeUsers() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    const seedCitizen = [
      {
        id: 'CIT-1001',
        fullName: 'Ramesh Kulkarni',
        mobileNumber: '9822012345',
        email: 'ramesh.k@example.com',
        ward: 'Prabhag 2 - Jule Solapur',
        address: 'Plot 42, Saiful, Jule Solapur',
        passwordHash: hashPassword('citizen@123'),
        createdAt: '2026-10-10T10:00:00.000Z'
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(seedCitizen, null, 2), 'utf8');
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_smc_solapur_salt').digest('hex');
}

function readUsers() {
  initializeUsers();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading citizens data:', error);
    return [];
  }
}

function writeUsers(data) {
  initializeUsers();
  const tempFile = `${USERS_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, USERS_FILE);
}

const UserStore = {
  // Register citizen
  async register({ fullName, mobileNumber, email, password, ward, address }) {
    const cleanMobile = (mobileNumber || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const hashed = hashPassword(password);
    const id = `CIT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    if (isMongoConnected()) {
      try {
        const existingMobile = await Citizen.findOne({ mobileNumber: cleanMobile });
        if (existingMobile) {
          throw new Error('This mobile number is already registered. Please log in.');
        }

        if (cleanEmail) {
          const existingEmail = await Citizen.findOne({ email: cleanEmail });
          if (existingEmail) {
            throw new Error('An account with this email address already exists.');
          }
        }

        const citizenDoc = await Citizen.create({
          citizenId: id,
          fullName: (fullName || '').trim(),
          mobileNumber: cleanMobile,
          email: cleanEmail,
          ward: ward || '',
          address: (address || '').trim(),
          passwordHash: hashed
        });

        // Also sync to JSON
        const users = readUsers();
        users.push({
          id,
          fullName: citizenDoc.fullName,
          mobileNumber: citizenDoc.mobileNumber,
          email: citizenDoc.email,
          ward: citizenDoc.ward,
          address: citizenDoc.address,
          passwordHash: hashed,
          createdAt: now
        });
        writeUsers(users);

        const token = `cit_token_${id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        return {
          token,
          user: {
            id,
            fullName: citizenDoc.fullName,
            mobileNumber: citizenDoc.mobileNumber,
            email: citizenDoc.email,
            ward: citizenDoc.ward,
            address: citizenDoc.address
          }
        };
      } catch (err) {
        if (err.message && err.message.includes('already registered')) {
          throw err;
        }
        console.warn('MongoDB citizen registration error, fallback to JSON:', err.message);
      }
    }

    // JSON file store fallback
    const users = readUsers();
    if (users.some(u => u.mobileNumber === cleanMobile)) {
      throw new Error('This mobile number is already registered. Please log in.');
    }

    if (cleanEmail && users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = {
      id,
      fullName: (fullName || '').trim(),
      mobileNumber: cleanMobile,
      email: cleanEmail,
      ward: ward || '',
      address: (address || '').trim(),
      passwordHash: hashed,
      createdAt: now
    };

    users.push(newUser);
    writeUsers(users);

    const token = `cit_token_${id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        mobileNumber: newUser.mobileNumber,
        email: newUser.email,
        ward: newUser.ward,
        address: newUser.address
      }
    };
  },

  // Login citizen
  async login(identifier, password) {
    const cleanIdent = (identifier || '').trim().toLowerCase();
    const hashed = hashPassword(password);

    if (isMongoConnected()) {
      try {
        const userDoc = await Citizen.findOne({
          $or: [
            { mobileNumber: cleanIdent },
            { email: cleanIdent }
          ],
          passwordHash: hashed
        });

        if (userDoc) {
          const token = `cit_token_${userDoc.citizenId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          return {
            token,
            user: {
              id: userDoc.citizenId,
              fullName: userDoc.fullName,
              mobileNumber: userDoc.mobileNumber,
              email: userDoc.email,
              ward: userDoc.ward,
              address: userDoc.address
            }
          };
        }
      } catch (err) {
        console.warn('MongoDB citizen login error, checking JSON store:', err.message);
      }
    }

    const users = readUsers();
    const user = users.find(u => 
      (u.mobileNumber === cleanIdent || (u.email && u.email.toLowerCase() === cleanIdent)) &&
      u.passwordHash === hashed
    );

    if (!user) {
      throw new Error('Invalid mobile number/email or password.');
    }

    const token = `cit_token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        email: user.email,
        ward: user.ward,
        address: user.address
      }
    };
  },

  // Verify token
  async verifyToken(token) {
    if (!token || !token.startsWith('cit_token_CIT-')) {
      return null;
    }
    const parts = token.split('_');
    const citizenId = parts[2];

    if (isMongoConnected()) {
      try {
        const userDoc = await Citizen.findOne({ citizenId });
        if (userDoc) {
          return {
            id: userDoc.citizenId,
            fullName: userDoc.fullName,
            mobileNumber: userDoc.mobileNumber,
            email: userDoc.email,
            ward: userDoc.ward,
            address: userDoc.address
          };
        }
      } catch (err) {
        console.warn('MongoDB verifyToken error:', err.message);
      }
    }

    const users = readUsers();
    const user = users.find(u => u.id === citizenId);
    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      email: user.email,
      ward: user.ward,
      address: user.address
    };
  },

  async getByMobile(mobile) {
    const cleanMobile = (mobile || '').trim();

    if (isMongoConnected()) {
      try {
        const userDoc = await Citizen.findOne({ mobileNumber: cleanMobile });
        if (userDoc) {
          return {
            id: userDoc.citizenId,
            fullName: userDoc.fullName,
            mobileNumber: userDoc.mobileNumber,
            email: userDoc.email,
            ward: userDoc.ward,
            address: userDoc.address
          };
        }
      } catch (err) {
        console.warn('MongoDB getByMobile error:', err.message);
      }
    }

    const users = readUsers();
    return users.find(u => u.mobileNumber === cleanMobile) || null;
  }
};

module.exports = UserStore;
