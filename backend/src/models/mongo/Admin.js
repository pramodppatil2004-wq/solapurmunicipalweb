const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: 'SMC-ADMIN-01'
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    default: 'Shri. A. K. Patil'
  },
  designation: {
    type: String,
    default: 'Municipal Grievance Administrator'
  },
  department: {
    type: String,
    default: 'Central Administration'
  },
  role: {
    type: String,
    default: 'Single Administrator'
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: 'admin@solapurcorporation.gov.in'
  },
  mobileNumber: {
    type: String,
    trim: true,
    default: '9422011223'
  },
  passwordHash: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    }
  }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

module.exports = Admin;
