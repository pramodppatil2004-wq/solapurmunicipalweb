const fs = require('fs');
const path = require('path');
const { isMongoConnected } = require('../config/db');
const Grievance = require('./mongo/Grievance');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'grievances.json');
const SEED_FILE = path.join(DATA_DIR, 'seedData.json');

// Ensure data file exists with seed data
function initializeStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    if (fs.existsSync(SEED_FILE)) {
      const seedContent = fs.readFileSync(SEED_FILE, 'utf8');
      fs.writeFileSync(DATA_FILE, seedContent, 'utf8');
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  }
}

// Read all grievances from JSON store
function readData() {
  initializeStorage();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading grievances store:', error);
    return [];
  }
}

// Write grievances to JSON store
function writeData(data) {
  initializeStorage();
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

// Generate unique tracking token: SMC-2026-XXXX
function generateToken(existingList) {
  const existingTokens = new Set(existingList.map(g => (g.trackingToken || '').toUpperCase()));
  let token = '';
  do {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    token = `SMC-2026-${randomNum}`;
  } while (existingTokens.has(token));
  return token;
}

function formatDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id && !obj.id) obj.id = String(obj._id);
  delete obj.__v;
  return obj;
}

const GrievanceStore = {
  // Get all with optional filters and sorting
  async getAll({ status, department, ward, priority, search } = {}) {
    if (isMongoConnected()) {
      try {
        const query = {};
        if (status && status !== 'all') {
          query.status = new RegExp(`^${status}$`, 'i');
        }
        if (department && department !== 'all') {
          query.department = new RegExp(`^${department}$`, 'i');
        }
        if (ward && ward !== 'all') {
          query.ward = new RegExp(ward, 'i');
        }
        if (priority && priority !== 'all') {
          query.priority = new RegExp(`^${priority}$`, 'i');
        }
        if (search && search.trim() !== '') {
          const q = search.trim();
          query.$or = [
            { trackingToken: new RegExp(q, 'i') },
            { citizenName: new RegExp(q, 'i') },
            { title: new RegExp(q, 'i') },
            { description: new RegExp(q, 'i') },
            { address: new RegExp(q, 'i') },
            { mobileNumber: new RegExp(q, 'i') }
          ];
        }

        const docs = await Grievance.find(query).sort({ createdAt: -1 });
        return docs.map(formatDoc);
      } catch (err) {
        console.warn('MongoDB query error, falling back to JSON:', err.message);
      }
    }

    // Fallback: JSON file store
    let list = readData();

    if (status && status !== 'all') {
      list = list.filter(g => (g.status || '').toLowerCase() === status.toLowerCase());
    }

    if (department && department !== 'all') {
      list = list.filter(g => (g.department || '').toLowerCase() === department.toLowerCase());
    }

    if (ward && ward !== 'all') {
      list = list.filter(g => (g.ward || '').toLowerCase().includes(ward.toLowerCase()));
    }

    if (priority && priority !== 'all') {
      list = list.filter(g => (g.priority || '').toLowerCase() === priority.toLowerCase());
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(g =>
        (g.trackingToken && g.trackingToken.toLowerCase().includes(q)) ||
        (g.citizenName && g.citizenName.toLowerCase().includes(q)) ||
        (g.title && g.title.toLowerCase().includes(q)) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        (g.address && g.address.toLowerCase().includes(q)) ||
        (g.mobileNumber && g.mobileNumber.includes(q))
      );
    }

    // Sort by createdAt descending (newest first)
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Get by Tracking Token (case insensitive)
  async getByToken(token) {
    if (!token) return null;
    const cleanToken = token.trim().toUpperCase();

    if (isMongoConnected()) {
      try {
        const doc = await Grievance.findOne({ trackingToken: cleanToken });
        if (doc) return formatDoc(doc);
      } catch (err) {
        console.warn('MongoDB getByToken error, falling back:', err.message);
      }
    }

    const list = readData();
    return list.find(g => (g.trackingToken || '').toUpperCase() === cleanToken) || null;
  },

  // Get by ID
  async getById(id) {
    if (isMongoConnected()) {
      try {
        let doc = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          doc = await Grievance.findById(id);
        }
        if (!doc) {
          doc = await Grievance.findOne({ id: String(id) });
        }
        if (doc) return formatDoc(doc);
      } catch (err) {
        console.warn('MongoDB getById error, falling back:', err.message);
      }
    }

    const list = readData();
    return list.find(g => String(g.id) === String(id)) || null;
  },

  // Get by Mobile Number
  async getByMobile(mobile) {
    if (!mobile) return [];
    const cleanMobile = mobile.trim();

    if (isMongoConnected()) {
      try {
        const docs = await Grievance.find({ mobileNumber: cleanMobile }).sort({ createdAt: -1 });
        return docs.map(formatDoc);
      } catch (err) {
        console.warn('MongoDB getByMobile error, falling back:', err.message);
      }
    }

    const list = readData();
    return list.filter(g => (g.mobileNumber || '').trim() === cleanMobile);
  },

  // Get by Citizen ID
  async getByCitizenId(citizenId) {
    if (!citizenId) return [];

    if (isMongoConnected()) {
      try {
        const docs = await Grievance.find({ citizenId: String(citizenId) }).sort({ createdAt: -1 });
        return docs.map(formatDoc);
      } catch (err) {
        console.warn('MongoDB getByCitizenId error, falling back:', err.message);
      }
    }

    const list = readData();
    return list.filter(g => String(g.citizenId) === String(citizenId));
  },

  // Create a new grievance
  async create(data) {
    const now = new Date().toISOString();
    const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();

    let list = readData();
    const trackingToken = generateToken(list);

    const newGrievance = {
      id,
      trackingToken,
      citizenId: data.citizenId || null,
      citizenName: (data.citizenName || '').trim(),
      mobileNumber: (data.mobileNumber || '').trim(),
      email: (data.email || '').trim(),
      department: data.department || 'General Administration',
      ward: data.ward || 'General',
      address: (data.address || '').trim(),
      priority: data.priority || 'Normal',
      title: (data.title || '').trim(),
      description: (data.description || '').trim(),
      photoUrl: data.photoUrl || '',
      resolutionPhotoUrl: data.resolutionPhotoUrl || '',
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      geoAddress: data.geoAddress || '',
      status: 'Submitted',
      assignedOfficer: null,
      officerRemarks: '',
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'Submitted',
          title: 'Grievance Registered',
          description: `Grievance successfully lodged by ${data.citizenName || 'citizen'}.${data.latitude ? ` Geo-tagged at (${data.latitude}, ${data.longitude}).` : ''} Tracking token generated.`,
          hasResolutionPhoto: false,
          timestamp: now
        }
      ],
      feedback: null
    };

    // Save to JSON store
    list.unshift(newGrievance);
    writeData(list);

    // Save to MongoDB if connected
    if (isMongoConnected()) {
      try {
        const mongoDoc = await Grievance.create(newGrievance);
        return formatDoc(mongoDoc);
      } catch (err) {
        console.warn('Error saving grievance to MongoDB, cached in JSON:', err.message);
      }
    }

    return newGrievance;
  },

  // Update status, work done photo, and append timeline event
  async updateStatus(id, { status, assignedOfficer, officerRemarks, resolutionPhotoUrl }) {
    const now = new Date().toISOString();
    let updatedItem = null;

    const statusTitleMap = {
      'Submitted': 'Grievance Registered',
      'Under Review': 'Under Preliminary Verification',
      'Assigned': 'Assigned to Ward Field Officer',
      'In Progress': 'Ground Resolution In Progress',
      'Resolved': 'Civic Grievance Resolved & Verified',
      'Rejected': 'Grievance Closed / Not Feasible'
    };

    // 1. Update in MongoDB if connected
    if (isMongoConnected()) {
      try {
        let doc = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          doc = await Grievance.findById(id);
        }
        if (!doc) {
          doc = await Grievance.findOne({ id: String(id) });
        }

        if (doc) {
          const newStatus = status || doc.status;
          const remarks = officerRemarks !== undefined ? officerRemarks : doc.officerRemarks;
          const officer = assignedOfficer !== undefined ? assignedOfficer : doc.assignedOfficer;
          const finalPhoto = resolutionPhotoUrl !== undefined ? resolutionPhotoUrl : doc.resolutionPhotoUrl;

          const timelineEntry = {
            status: newStatus,
            title: statusTitleMap[newStatus] || `Status updated to ${newStatus}`,
            description: remarks || `Status changed to ${newStatus}${officer ? ` (Assigned: ${officer})` : ''}`,
            hasResolutionPhoto: Boolean(finalPhoto),
            timestamp: now
          };

          doc.status = newStatus;
          if (assignedOfficer !== undefined) doc.assignedOfficer = assignedOfficer;
          if (officerRemarks !== undefined) doc.officerRemarks = officerRemarks;
          if (resolutionPhotoUrl !== undefined) doc.resolutionPhotoUrl = resolutionPhotoUrl;
          doc.timeline.push(timelineEntry);

          await doc.save();
          updatedItem = formatDoc(doc);
        }
      } catch (err) {
        console.warn('MongoDB updateStatus error, falling back:', err.message);
      }
    }

    // 2. Also keep JSON store synchronized
    const list = readData();
    const index = list.findIndex(g => String(g.id) === String(id) || String(g.trackingToken) === String(id));
    if (index !== -1) {
      const g = list[index];
      const newStatus = status || g.status;
      const remarks = officerRemarks !== undefined ? officerRemarks : g.officerRemarks;
      const officer = assignedOfficer !== undefined ? assignedOfficer : g.assignedOfficer;

      const timelineEntry = {
        status: newStatus,
        title: statusTitleMap[newStatus] || `Status updated to ${newStatus}`,
        description: remarks || `Status changed to ${newStatus}${officer ? ` (Assigned: ${officer})` : ''}`,
        hasResolutionPhoto: Boolean(resolutionPhotoUrl !== undefined ? resolutionPhotoUrl : g.resolutionPhotoUrl),
        timestamp: now
      };

      g.status = newStatus;
      if (officer !== undefined) g.assignedOfficer = officer;
      if (remarks !== undefined) g.officerRemarks = remarks;
      if (resolutionPhotoUrl !== undefined) g.resolutionPhotoUrl = resolutionPhotoUrl;
      g.updatedAt = now;
      g.timeline = g.timeline || [];
      g.timeline.push(timelineEntry);

      list[index] = g;
      writeData(list);
      if (!updatedItem) updatedItem = g;
    }

    return updatedItem;
  },

  // Citizen satisfaction feedback
  async addFeedback(idOrToken, { rating, comment }) {
    const now = new Date().toISOString();
    let updatedItem = null;

    if (isMongoConnected()) {
      try {
        let doc = await Grievance.findOne({
          $or: [
            { trackingToken: String(idOrToken).trim().toUpperCase() },
            { id: String(idOrToken) }
          ]
        });

        if (doc) {
          doc.feedback = {
            rating: Number(rating) || 5,
            comment: (comment || '').trim(),
            submittedAt: now
          };
          await doc.save();
          updatedItem = formatDoc(doc);
        }
      } catch (err) {
        console.warn('MongoDB addFeedback error:', err.message);
      }
    }

    // Synchronize JSON
    const list = readData();
    const index = list.findIndex(
      g => String(g.id) === String(idOrToken) || (g.trackingToken || '').toUpperCase() === String(idOrToken).trim().toUpperCase()
    );

    if (index !== -1) {
      list[index].feedback = {
        rating: Number(rating) || 5,
        comment: (comment || '').trim(),
        submittedAt: now
      };
      list[index].updatedAt = now;
      writeData(list);
      if (!updatedItem) updatedItem = list[index];
    }

    return updatedItem;
  },

  // Overall statistics for dashboard
  async getStats() {
    let list = [];

    if (isMongoConnected()) {
      try {
        const docs = await Grievance.find({});
        list = docs.map(formatDoc);
      } catch (err) {
        console.warn('MongoDB getStats error, using JSON store:', err.message);
        list = readData();
      }
    } else {
      list = readData();
    }

    const total = list.length;
    let resolved = 0;
    let inProgress = 0;
    let underReview = 0;
    let assigned = 0;
    let submitted = 0;
    let rejected = 0;
    let urgent = 0;

    const deptMap = {};
    const wardMap = {};
    let totalRating = 0;
    let ratedCount = 0;

    for (const g of list) {
      const st = (g.status || '').toLowerCase();
      if (st === 'resolved') resolved++;
      else if (st === 'in progress') inProgress++;
      else if (st === 'under review') underReview++;
      else if (st === 'assigned') assigned++;
      else if (st === 'submitted') submitted++;
      else if (st === 'rejected') rejected++;

      if ((g.priority || '').toLowerCase() === 'urgent' || (g.priority || '').toLowerCase() === 'high') {
        urgent++;
      }

      // Department aggregation
      const dept = g.department || 'Other';
      deptMap[dept] = (deptMap[dept] || 0) + 1;

      // Ward aggregation
      const ward = g.ward || 'Other';
      wardMap[ward] = (wardMap[ward] || 0) + 1;

      // Feedback average
      if (g.feedback && g.feedback.rating) {
        totalRating += Number(g.feedback.rating);
        ratedCount++;
      }
    }

    const pending = total - resolved - rejected;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    const avgRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : '4.8';

    return {
      total,
      pending,
      submitted,
      underReview,
      assigned,
      inProgress,
      resolved,
      rejected,
      urgent,
      resolutionRate,
      avgRating,
      ratedCount,
      departmentBreakdown: deptMap,
      wardBreakdown: wardMap
    };
  }
};

module.exports = GrievanceStore;
