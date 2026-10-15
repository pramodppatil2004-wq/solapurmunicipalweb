const mongoose = require('mongoose');

const CitizenSchema = new mongoose.Schema({
  citizenId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fullName: {
    type: String,
    required: [true, 'Citizen full name is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, '10-digit mobile number is required'],
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  ward: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
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

const Citizen = mongoose.models.Citizen || mongoose.model('Citizen', CitizenSchema);

module.exports = Citizen;
