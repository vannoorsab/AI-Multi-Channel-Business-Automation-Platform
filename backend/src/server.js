require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');
const { initWhatsAppSimService } = require('./services/whatsappSimService');

// Initialize Express App
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO Server
const io = socketio(server, {
  cors: {
    origin: '*', // Allows broad connection for development; restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Store io instance on app context to access it in controllers
app.set('socketio', io);

// Initialize WhatsApp Simulation Service with Socket Context
initWhatsAppSimService(io);

// Setup Sockets
socketHandler(io);

// Standard Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));
app.use(helmet({
  contentSecurityPolicy: false, // Prevents issues with React hot-reloads during dev
}));
app.use(morgan('dev'));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const leadRoutes = require('./routes/leadRoutes');
const messageRoutes = require('./routes/messageRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const documentRoutes = require('./routes/documentRoutes');
const twilioRoutes = require('./routes/twilioRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
// Nodemon trigger change comment to restart backend server context after DB healing

