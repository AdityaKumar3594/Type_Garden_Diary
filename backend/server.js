const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const entryRoutes = require('./routes/entryRoutes');

const { PORT = 3000, NODE_ENV, JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  console.error('JWT_SECRET must be set in .env');
  process.exit(1);
}

const app = express();

if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ['https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
  })
);

// Body and cookie parsing
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

// Static frontend serving
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes);

// Fallback to index.html for SPA-style client routing if needed
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start database and server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Type Garden diary server running on http://localhost:${PORT}`);
  });
};

startServer();
