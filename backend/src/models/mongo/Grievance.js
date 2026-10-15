const mongoose = require('mongoose');

const TimelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  hasResolutionPhoto: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const FeedbackSchema = new mongoose.Schema({
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const GrievanceSchema = new mongoose.Schema({
  id: {
    type: String,
    index: true
  },
  trackingToken: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  citizenId: {
    type: String,
    index: true,
    default: null
  },
  citizenName: {
    type: String,
    required: [true, 'Citizen name is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, '10-digit mobile number is required'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    index: true
  },
  ward: {
    type: String,
    required: [true, 'Ward/Prabhag is required'],
    index: true
  },
  address: {
    type: String,
    required: [true, 'Incident address is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  title: {
    type: String,
    required: [true, 'Grievance title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Grievance description is required'],
    trim: true
  },
  photoUrl: {
    type: String,
    default: ''
  },
  resolutionPhotoUrl: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  geoAddress: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Submitted',
    index: true
  },
  assignedOfficer: {
    type: String,
    default: null
  },
  officerRemarks: {
    type: String,
    default: ''
  },
  timeline: [TimelineEventSchema],
  feedback: {
    type: FeedbackSchema,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      if (!ret.id && ret._id) {
        ret.id = String(ret._id);
      }
      return ret;
    }
  }
});

// Text index for search across tokens, titles, wards, citizens
GrievanceSchema.index({
  trackingToken: 'text',
  citizenName: 'text',
  title: 'text',
  description: 'text',
  address: 'text',
  ward: 'text'
});

const Grievance = mongoose.models.Grievance || mongoose.model('Grievance', GrievanceSchema);

module.exports = Grievance;
