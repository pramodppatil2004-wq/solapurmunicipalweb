const GrievanceStore = require('../models/grievanceStore');

const statsController = {
  getOverview(req, res) {
    try {
      const stats = GrievanceStore.getStats();
      const all = GrievanceStore.getAll();

      // Recent 5 public resolved or in-progress complaints for transparency feed (citizen names masked)
      const publicFeed = all
        .slice(0, 8)
        .map(item => ({
          trackingToken: item.trackingToken,
          maskedName: item.citizenName ? `${item.citizenName.charAt(0)}*** ${item.citizenName.split(' ')[1] ? item.citizenName.split(' ')[1].charAt(0) + '***' : ''}` : 'Citizen',
          department: item.department,
          ward: item.ward,
          title: item.title,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          feedback: item.feedback
        }));

      res.json({
        success: true,
        data: {
          ...stats,
          publicFeed
        }
      });
    } catch (error) {
      console.error('Error compiling statistics:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve grievance analytics.' });
    }
  }
};

module.exports = statsController;
