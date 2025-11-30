import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/database.js';
import { User, Unit, Product, Order, OrderDayBill, OrderItem } from './models/index.js';

// Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import unitRoutes from './routes/units.js';
import orderRoutes from './routes/orders.js';
import logRoutes from './routes/logs.js';
import userRoutes from './routes/users.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'prithvi-kiosk-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/users', userRoutes);

// Serve React app in production (SPA routing)
// Must be after API routes
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  // Serve React app for all other routes
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync models (use with caution in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synced.');
    }

    // Listen on all interfaces (0.0.0.0) in production to allow external access
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    
    app.listen(PORT, host, () => {
      console.log(`Server running on ${host}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.NODE_ENV === 'production') {
        console.log(`Access from network: http://YOUR_SERVER_IP:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

