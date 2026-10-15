// Authentication Controller for Municipal Officers and Administrators
const authController = {
  login(req, res) {
    try {
      const { username, password } = req.body;

      const validUser = process.env.ADMIN_USERNAME || 'admin';
      const validPass = process.env.ADMIN_PASSWORD || 'solapur@123';

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Both username and password are required.'
        });
      }

      if (username.trim() === validUser && password === validPass) {
        // Return session token and officer details
        const sessionToken = `smc_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        return res.json({
          success: true,
          message: 'Authentication successful. Welcome to Solapur Municipal Corporation Officer Portal.',
          token: sessionToken,
          officer: {
            username: validUser,
            name: 'Shri. A. K. Patil',
            designation: 'Central Nodal Grievance Officer',
            department: 'Municipal Commissioner Secretariat, Solapur',
            zone: 'Central Command'
          }
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid municipal credentials. Please check your username and password.'
      });
    } catch (error) {
      console.error('Error during authentication:', error);
      res.status(500).json({ success: false, message: 'Authentication service encountered an error.' });
    }
  },

  // Verify active session
  verify(req, res) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer smc_session_')) {
      return res.json({
        success: true,
        valid: true,
        officer: {
          username: 'admin',
          name: 'Shri. A. K. Patil',
          designation: 'Central Nodal Grievance Officer'
        }
      });
    }
    return res.status(401).json({ success: false, valid: false, message: 'Session expired or invalid.' });
  }
};

module.exports = authController;
