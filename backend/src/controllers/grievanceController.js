const GrievanceStore = require('../models/grievanceStore');
const UserStore = require('../models/userStore');

// Controller for all citizen and municipal grievance operations
const grievanceController = {
  // GET /api/grievances - list all with filtering
  async getAll(req, res) {
    try {
      const { status, department, ward, priority, search } = req.query;
      const list = await GrievanceStore.getAll({ status, department, ward, priority, search });
      res.json({
        success: true,
        count: list.length,
        data: list
      });
    } catch (error) {
      console.error('Error fetching grievances:', error);
      res.status(500).json({ success: false, message: 'Internal server error while fetching grievances.' });
    }
  },

  // GET /api/grievances/my - list grievances filed by currently logged-in citizen
  async getMy(req, res) {
    try {
      const authHeader = req.headers.authorization;
      let citizen = null;

      if (authHeader && authHeader.startsWith('Bearer cit_token_')) {
        const token = authHeader.replace('Bearer ', '');
        citizen = await UserStore.verifyToken(token);
      }

      const mobileParam = req.query.mobile;
      const citizenMobile = citizen ? citizen.mobileNumber : mobileParam;

      if (!citizenMobile) {
        return res.status(401).json({
          success: false,
          message: 'Please log in as a citizen to view your complaints.'
        });
      }

      const list = await GrievanceStore.getByMobile(citizenMobile);
      return res.json({
        success: true,
        count: list.length,
        data: list
      });
    } catch (error) {
      console.error('Error fetching citizen grievances:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve your complaints.' });
    }
  },

  // GET /api/grievances/track/:query - track by tracking token (SMC-2026-XXXX) or 10-digit mobile number
  async track(req, res) {
    try {
      const query = (req.params.query || '').trim();
      if (!query) {
        return res.status(400).json({ success: false, message: 'Please provide a tracking token or mobile number.' });
      }

      // Check if it's a tracking token
      if (query.toUpperCase().startsWith('SMC-')) {
        const item = await GrievanceStore.getByToken(query);
        if (!item) {
          return res.status(404).json({ success: false, message: `No grievance found with token "${query}".` });
        }
        return res.json({ success: true, count: 1, data: [item] });
      }

      // Check if it's a mobile number (or partial token fallback)
      const byMobile = await GrievanceStore.getByMobile(query);
      if (byMobile && byMobile.length > 0) {
        return res.json({ success: true, count: byMobile.length, data: byMobile });
      }

      // Fallback check by token in case token was passed without SMC prefix
      const fallbackToken = await GrievanceStore.getByToken(query);
      if (fallbackToken) {
        return res.json({ success: true, count: 1, data: [fallbackToken] });
      }

      return res.status(404).json({
        success: false,
        message: `No grievance record found matching "${query}". Please check the details and try again.`
      });
    } catch (error) {
      console.error('Error tracking grievance:', error);
      res.status(500).json({ success: false, message: 'Error tracking grievance record.' });
    }
  },

  // GET /api/grievances/:id - get grievance by unique ID
  async getById(req, res) {
    try {
      const item = await GrievanceStore.getById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Grievance not found.' });
      }
      res.json({ success: true, data: item });
    } catch (error) {
      console.error('Error fetching grievance by ID:', error);
      res.status(500).json({ success: false, message: 'Error retrieving grievance.' });
    }
  },

  // POST /api/grievances - create new complaint (Requires authorization/registration)
  async create(req, res) {
    try {
      const {
        citizenId,
        citizenName,
        mobileNumber,
        email,
        department,
        ward,
        address,
        priority,
        title,
        description,
        photoUrl,
        latitude,
        longitude,
        geoAddress
      } = req.body;

      // Check for citizen authorization header
      const authHeader = req.headers.authorization;
      let authenticatedCitizen = null;
      if (authHeader && authHeader.startsWith('Bearer cit_token_')) {
        const token = authHeader.replace('Bearer ', '');
        authenticatedCitizen = await UserStore.verifyToken(token);
      }

      // Validation
      const finalCitizenName = authenticatedCitizen ? authenticatedCitizen.fullName : citizenName;
      const finalMobileNumber = authenticatedCitizen ? authenticatedCitizen.mobileNumber : mobileNumber;
      const finalEmail = authenticatedCitizen ? authenticatedCitizen.email : email;
      const finalCitizenId = authenticatedCitizen ? authenticatedCitizen.id : citizenId;

      if (!finalCitizenName || finalCitizenName.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Citizen name is required. Please log in or register first.' });
      }

      const mobileRegex = /^[6-9]\d{9}$/;
      if (!finalMobileNumber || !mobileRegex.test(finalMobileNumber.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' });
      }

      if (!department || department === 'Select Department') {
        return res.status(400).json({ success: false, message: 'Please select a valid municipal department.' });
      }

      if (!ward || ward === 'Select Ward') {
        return res.status(400).json({ success: false, message: 'Please select a municipal ward / prabhag in Solapur.' });
      }

      if (!address || address.trim().length < 5) {
        return res.status(400).json({ success: false, message: 'Please provide a detailed address or landmark.' });
      }

      if (!title || title.trim().length < 5) {
        return res.status(400).json({ success: false, message: 'Complaint subject/title must be at least 5 characters long.' });
      }

      if (!description || description.trim().length < 15) {
        return res.status(400).json({ success: false, message: 'Please describe the problem in detail (minimum 15 characters).' });
      }

      const newGrievance = await GrievanceStore.create({
        citizenId: finalCitizenId,
        citizenName: finalCitizenName,
        mobileNumber: finalMobileNumber,
        email: finalEmail,
        department,
        ward,
        address,
        priority: priority || 'Normal',
        title,
        description,
        photoUrl: photoUrl || '',
        latitude: latitude || null,
        longitude: longitude || null,
        geoAddress: geoAddress || ''
      });

      res.status(201).json({
        success: true,
        message: 'Grievance lodged successfully. Keep your tracking token safe for future reference.',
        data: newGrievance
      });
    } catch (error) {
      console.error('Error lodging grievance:', error);
      res.status(500).json({ success: false, message: 'Failed to lodge grievance. Please try again.' });
    }
  },

  // PATCH /api/grievances/:id/status - officer updates status & remarks
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, assignedOfficer, officerRemarks, resolutionPhotoUrl } = req.body;

      const validStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const updated = await GrievanceStore.updateStatus(id, {
        status,
        assignedOfficer,
        officerRemarks,
        resolutionPhotoUrl: resolutionPhotoUrl !== undefined ? resolutionPhotoUrl : undefined
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Grievance not found.' });
      }

      res.json({
        success: true,
        message: `Grievance status updated to "${updated.status}" successfully.`,
        data: updated
      });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ success: false, message: 'Error updating grievance status.' });
    }
  },

  // POST /api/grievances/:id/feedback - citizen satisfaction rating
  async submitFeedback(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      const numericRating = Number(rating);
      if (!numericRating || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
      }

      const updated = await GrievanceStore.addFeedback(id, {
        rating: numericRating,
        comment: comment || ''
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Grievance record not found.' });
      }

      res.json({
        success: true,
        message: 'Thank you! Your feedback has been recorded by Solapur Municipal Corporation.',
        data: updated
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      res.status(500).json({ success: false, message: 'Error submitting feedback.' });
    }
  }
};

module.exports = grievanceController;
