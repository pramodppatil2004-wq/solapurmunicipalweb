const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isMongoConnected } = require('../config/db');
const Admin = require('./mongo/Admin');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OFFICERS_FILE = path.join(DATA_DIR, 'officers.json');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_smc_admin_salt_2026').digest('hex');
}

function initializeOfficers() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(OFFICERS_FILE)) {
    const seedOfficers = [
      {
        id: 'OFF-001',
        employeeId: 'SMC-ADMIN-01',
        fullName: 'Shri. A. K. Patil',
        designation: 'Municipal Grievance Administrator',
        department: 'Central Administration',
        role: 'Single Administrator',
        username: 'admin',
        email: 'admin@solapurcorporation.gov.in',
        mobileNumber: '9422011223',
        passwordHash: hashPassword('solapur@123'),
        createdAt: '2026-10-01T08:00:00.000Z'
      }
    ];
    fs.writeFileSync(OFFICERS_FILE, JSON.stringify(seedOfficers, null, 2), 'utf8');
  }
}

function readOfficers() {
  initializeOfficers();
  try {
    const raw = fs.readFileSync(OFFICERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading officers data:', e);
    return [];
  }
}

function writeOfficers(data) {
  initializeOfficers();
  const tempFile = `${OFFICERS_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, OFFICERS_FILE);
}

const AdminStore = {
  // Officer login
  async login(username, password) {
    const cleanUser = (username || '').trim().toLowerCase();
    const hashed = hashPassword(password);

    if (isMongoConnected()) {
      try {
        const adminDoc = await Admin.findOne({
          $or: [
            { username: cleanUser },
            { email: cleanUser },
            { employeeId: cleanUser.toUpperCase() }
          ],
          passwordHash: hashed
        });

        if (adminDoc) {
          const token = `adm_token_${adminDoc.employeeId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          return {
            token,
            officer: {
              id: adminDoc.employeeId,
              employeeId: adminDoc.employeeId,
              fullName: adminDoc.fullName,
              designation: adminDoc.designation,
              department: adminDoc.department,
              role: adminDoc.role,
              username: adminDoc.username,
              email: adminDoc.email,
              mobileNumber: adminDoc.mobileNumber
            }
          };
        }
      } catch (err) {
        console.warn('MongoDB admin login error, falling back to JSON:', err.message);
      }
    }

    const officers = readOfficers();
    const officer = officers.find(o => 
      (o.username.toLowerCase() === cleanUser || o.email.toLowerCase() === cleanUser || (o.employeeId && o.employeeId.toLowerCase() === cleanUser)) &&
      o.passwordHash === hashed
    );

    if (!officer) {
      throw new Error('Invalid administrator credentials. Please verify your username and password.');
    }

    const token = `adm_token_${officer.id || officer.employeeId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      token,
      officer: {
        id: officer.id || officer.employeeId,
        employeeId: officer.employeeId || 'SMC-ADMIN-01',
        fullName: officer.fullName,
        designation: officer.designation,
        department: officer.department,
        role: officer.role,
        username: officer.username,
        email: officer.email,
        mobileNumber: officer.mobileNumber
      }
    };
  },

  // Officer Registration / Staff Onboarding
  async register({ employeeId, fullName, designation, department, username, email, mobileNumber, password, role }) {
    const cleanEmpId = (employeeId || '').trim().toUpperCase();
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const hashed = hashPassword(password);
    const id = `OFF-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    if (isMongoConnected()) {
      try {
        const existing = await Admin.findOne({
          $or: [
            { username: cleanUser },
            { employeeId: cleanEmpId },
            ...(cleanEmail ? [{ email: cleanEmail }] : [])
          ]
        });

        if (existing) {
          throw new Error(`Administrator username or employee ID is already registered.`);
        }

        const adminDoc = await Admin.create({
          employeeId: cleanEmpId || 'SMC-ADMIN-01',
          fullName: (fullName || '').trim(),
          designation: designation || 'Municipal Officer',
          department: department || 'General Administration',
          role: role || 'Department Officer',
          username: cleanUser,
          email: cleanEmail,
          mobileNumber: (mobileNumber || '').trim(),
          passwordHash: hashed
        });

        const token = `adm_token_${adminDoc.employeeId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        return {
          token,
          officer: {
            id: adminDoc.employeeId,
            employeeId: adminDoc.employeeId,
            fullName: adminDoc.fullName,
            designation: adminDoc.designation,
            department: adminDoc.department,
            role: adminDoc.role,
            username: adminDoc.username,
            email: adminDoc.email,
            mobileNumber: adminDoc.mobileNumber
          }
        };
      } catch (err) {
        if (err.message && err.message.includes('already registered')) throw err;
        console.warn('MongoDB admin register error, using JSON fallback:', err.message);
      }
    }

    const officers = readOfficers();
    if (officers.some(o => o.username.toLowerCase() === cleanUser)) {
      throw new Error(`Username "${username}" is already taken by another municipal officer.`);
    }

    const newOfficer = {
      id,
      employeeId: cleanEmpId || `SMC-EMP-${Math.floor(500 + Math.random() * 500)}`,
      fullName: (fullName || '').trim(),
      designation: (designation || 'Municipal Officer').trim(),
      department: department || 'General Administration',
      role: role || 'Department Officer',
      username: cleanUser,
      email: cleanEmail,
      mobileNumber: (mobileNumber || '').trim(),
      passwordHash: hashed,
      createdAt: now
    };

    officers.push(newOfficer);
    writeOfficers(officers);

    const token = `adm_token_${newOfficer.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      token,
      officer: {
        id: newOfficer.id,
        employeeId: newOfficer.employeeId,
        fullName: newOfficer.fullName,
        designation: newOfficer.designation,
        department: newOfficer.department,
        role: newOfficer.role,
        username: newOfficer.username,
        email: newOfficer.email,
        mobileNumber: newOfficer.mobileNumber
      }
    };
  },

  // Verify officer token
  async verifyToken(token) {
    if (!token || !token.startsWith('adm_token_')) {
      return null;
    }

    const parts = token.split('_');
    const offId = parts[2];

    if (isMongoConnected()) {
      try {
        const adminDoc = await Admin.findOne({
          $or: [
            { employeeId: offId },
            { username: offId }
          ]
        });

        if (adminDoc) {
          return {
            id: adminDoc.employeeId,
            employeeId: adminDoc.employeeId,
            fullName: adminDoc.fullName,
            designation: adminDoc.designation,
            department: adminDoc.department,
            role: adminDoc.role,
            username: adminDoc.username,
            email: adminDoc.email,
            mobileNumber: adminDoc.mobileNumber
          };
        }
      } catch (err) {
        console.warn('MongoDB verifyToken error:', err.message);
      }
    }

    const officers = readOfficers();
    const officer = officers.find(o => o.id === offId || o.employeeId === offId || o.username === offId);
    if (!officer) return null;

    return {
      id: officer.id || officer.employeeId,
      employeeId: officer.employeeId,
      fullName: officer.fullName,
      designation: officer.designation,
      department: officer.department,
      role: officer.role,
      username: officer.username,
      email: officer.email,
      mobileNumber: officer.mobileNumber
    };
  },

  // List all registered officers
  async getAllOfficers() {
    if (isMongoConnected()) {
      try {
        const docs = await Admin.find({});
        if (docs.length > 0) {
          return docs.map(o => ({
            id: o.employeeId,
            employeeId: o.employeeId,
            fullName: o.fullName,
            designation: o.designation,
            department: o.department,
            role: o.role,
            username: o.username,
            email: o.email,
            createdAt: o.createdAt
          }));
        }
      } catch (err) {
        console.warn('MongoDB getAllOfficers error:', err.message);
      }
    }

    const officers = readOfficers();
    return officers.map(o => ({
      id: o.id,
      employeeId: o.employeeId,
      fullName: o.fullName,
      designation: o.designation,
      department: o.department,
      role: o.role,
      username: o.username,
      email: o.email,
      createdAt: o.createdAt
    }));
  }
};

module.exports = AdminStore;
