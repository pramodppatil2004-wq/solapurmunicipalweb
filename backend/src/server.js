const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB, isMongoConnected } = require('./config/db');
const grievanceRoutes = require('./routes/grievanceRoutes');
const authRoutes = require('./routes/authRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body Parsers (allow up to 10mb for attached complaint photo data URLs)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/grievances', grievanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    portal: 'Solapur Municipal Corporation - Digital Grievance Redressal System',
    database: isMongoConnected() ? 'MongoDB (Connected)' : 'Local JSON Store (Resilient Fallback Mode)',
    mongoConnected: isMongoConnected(),
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Connect to MongoDB & Start server
async function startServer() {
  // Connect to MongoDB (with auto-seeding & graceful fallback)
  await connectDB();

  app.listen(PORT, () => {
    console.log('==================================================================');
    console.log('  🏛️  SOLAPUR MUNICIPAL CORPORATION (सोलापूर महानगरपालिका)');
    console.log('  Digital Grievance Redressal System is running successfully!');
    console.log(`  🌐 Portal URL:   http://localhost:${PORT}`);
    console.log(`  📡 API Health:   http://localhost:${PORT}/api/health`);
    console.log(`  🍃 Database:     ${isMongoConnected() ? 'MongoDB Connected' : 'Resilient JSON Store'}`);
    console.log(`  👮 Admin Demo:   admin / solapur@123`);
    console.log('==================================================================');
  });
}

startServer();
