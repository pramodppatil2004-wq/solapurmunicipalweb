const fs = require('fs');
const path = require('path');

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
  const existingTokens = new Set(existingList.map(g => g.trackingToken));
  let token = '';
  do {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    token = `SMC-2026-${randomNum}`;
  } while (existingTokens.has(token));
  return token;
}

const GrievanceStore = {
  // Get all with optional filters and sorting
  getAll({ status, department, ward, priority, search } = {}) {
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
  getByToken(token) {
    if (!token) return null;
    const cleanToken = token.trim().toUpperCase();
    const list = readData();
    return list.find(g => (g.trackingToken || '').toUpperCase() === cleanToken) || null;
  },

  // Get by ID
  getById(id) {
    const list = readData();
    return list.find(g => String(g.id) === String(id)) || null;
  },

  // Get by Mobile Number
  getByMobile(mobile) {
    if (!mobile) return [];
    const cleanMobile = mobile.trim();
    const list = readData();
    return list.filter(g => (g.mobileNumber || '').trim() === cleanMobile);
  },

  // Create a new grievance
  create(data) {
    const list = readData();
    const now = new Date().toISOString();
    const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
    const trackingToken = generateToken(list);

    const newGrievance = {
      id,
      trackingToken,
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
      status: 'Submitted',
      assignedOfficer: null,
      officerRemarks: '',
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'Submitted',
          title: 'Grievance Registered',
          description: `Grievance successfully lodged by ${data.citizenName || 'citizen'}. Tracking token generated.`,
          timestamp: now
        }
      ],
      feedback: null
    };

    list.unshift(newGrievance);
    writeData(list);
    return newGrievance;
  },

  // Update status and append timeline event
  updateStatus(id, { status, assignedOfficer, officerRemarks }) {
    const list = readData();
    const index = list.findIndex(g => String(g.id) === String(id));
    if (index === -1) return null;

    const g = list[index];
    const now = new Date().toISOString();

    const statusTitleMap = {
      'Submitted': 'Grievance Registered',
      'Under Review': 'Under Preliminary Verification',
      'Assigned': 'Assigned to Ward Field Officer',
      'In Progress': 'Ground Resolution In Progress',
      'Resolved': 'Civic Grievance Resolved',
      'Rejected': 'Grievance Closed / Not Feasible'
    };

    const newStatus = status || g.status;
    const remarks = officerRemarks !== undefined ? officerRemarks : g.officerRemarks;
    const officer = assignedOfficer !== undefined ? assignedOfficer : g.assignedOfficer;

    // Timeline entry
    const timelineEntry = {
      status: newStatus,
      title: statusTitleMap[newStatus] || `Status updated to ${newStatus}`,
      description: remarks || `Status changed to ${newStatus}${officer ? ` (Assigned: ${officer})` : ''}`,
      timestamp: now
    };

    g.status = newStatus;
    if (officer !== undefined) g.assignedOfficer = officer;
    if (remarks !== undefined) g.officerRemarks = remarks;
    g.updatedAt = now;
    g.timeline = g.timeline || [];
    g.timeline.push(timelineEntry);

    list[index] = g;
    writeData(list);
    return g;
  },

  // Citizen satisfaction feedback
  addFeedback(idOrToken, { rating, comment }) {
    const list = readData();
    const index = list.findIndex(
      g => String(g.id) === String(idOrToken) || (g.trackingToken || '').toUpperCase() === String(idOrToken).trim().toUpperCase()
    );

    if (index === -1) return null;

    const now = new Date().toISOString();
    list[index].feedback = {
      rating: Number(rating) || 5,
      comment: (comment || '').trim(),
      submittedAt: now
    };
    list[index].updatedAt = now;

    writeData(list);
    return list[index];
  },

  // Overall statistics for dashboard
  getStats() {
    const list = readData();
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
