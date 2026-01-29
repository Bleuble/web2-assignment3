

const express = require('express');
const connectDB = require('./src/config/db');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // Add this line
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


mongoose.connection.on('connecting', () => {
  console.log('🔄 Mongoose connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
  console.log(`📊 Database: ${mongoose.connection.name}`);
  console.log(`👤 User: ${mongoose.connection.user}`);
  console.log(`🏠 Host: ${mongoose.connection.host}`);
  console.log(`🔗 Ready State: ${mongoose.connection.readyState} (1=connected)`);
});

mongoose.connection.on('open', () => {
  console.log('🚪 MongoDB connection open');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔁 Mongoose reconnected to MongoDB');
});


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));


connectDB();


const blogRoutes = require('./src/routes/blogRoutes');
app.use('/api/blogs', blogRoutes); 


app.get('/api', (req, res) => {
  res.json({ 
    message: '🚀 Blogging Platform API is running!',
    endpoints: {
      'GET /api/blogs': 'Get all blog posts',
      'GET /api/blogs/:id': 'Get single blog post',
      'POST /api/blogs': 'Create new blog post',
      'PUT /api/blogs/:id': 'Update blog post',
      'DELETE /api/blogs/:id': 'Delete blog post',
      'GET /api/health': 'Check API health'
    },
    documentation: {
      'POST /api/blogs': 'Requires: {title: string, body: string, author?: string}',
      'PUT /api/blogs/:id': 'Requires at least one field to update'
    },
    frontend: 'Visit the root URL (/) for the web interface'
  });
});


app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const status = dbStatus === 1 ? 'healthy' : 'unhealthy';
  
  res.json({
    status: status,
    timestamp: new Date().toISOString(),
    database: dbStatus === 1 ? 'connected' : 'disconnected',
    dbStatus: dbStatus, 
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    port: PORT
  });
});


app.get('*', (req, res) => {
  
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      availableEndpoints: [
        'GET /api',
        'GET /api/health',
        'GET /api/blogs',
        'GET /api/blogs/:id',
        'POST /api/blogs',
        'PUT /api/blogs/:id',
        'DELETE /api/blogs/:id'
      ]
    });
  }
  
  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.message);
  console.error('📋 Stack:', err.stack);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});


mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log(`\n✨ =========================================== ✨`);
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Database: ${mongoose.connection.name}`);
    console.log(`👤 User: ${mongoose.connection.user}`);
    console.log(`🔗 Connection: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`✨ =========================================== ✨\n`);
    
    console.log('🎯 Frontend Interface:');
    console.log(`   🌐 Web Interface: http://localhost:${PORT}/\n`);
    
    console.log('📋 API Endpoints:');
    console.log(`   📖 API Docs:     GET  http://localhost:${PORT}/api`);
    console.log(`   ❤️  Health:       GET  http://localhost:${PORT}/api/health`);
    console.log(`   📖 Read All:     GET  http://localhost:${PORT}/api/blogs`);
    console.log(`   📝 Read One:     GET  http://localhost:${PORT}/api/blogs/:id`);
    console.log(`   ✨ Create:       POST http://localhost:${PORT}/api/blogs`);
    console.log(`   🔄 Update:       PUT  http://localhost:${PORT}/api/blogs/:id`);
    console.log(`   🗑️  Delete:       DELETE http://localhost:${PORT}/api/blogs/:id`);
    console.log('');
    
    console.log('🔧 Quick Tests:');
    console.log(`   curl -X GET http://localhost:${PORT}/api/blogs`);
    console.log(`   curl -X GET http://localhost:${PORT}/api/health`);
    console.log('');
    
    console.log('💡 Tip: Open http://localhost:' + PORT + ' in your browser for the web interface!');
  });
});


process.on('SIGINT', async () => {
  console.log('\n👋 Received SIGINT. Closing connections...');
  
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
  
  console.log('👋 Server shutting down');
  process.exit(0);
});


module.exports = app;