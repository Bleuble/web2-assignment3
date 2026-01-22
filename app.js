
// app.js
const express = require('express');
const connectDB = require('./src/config/db');
const cors = require('cors');
const mongoose = require('mongoose');  // ОДНО объявление!
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Мониторинг событий подключения MongoDB
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

// Middleware
app.use(cors()); // Разрешить запросы с фронтенда
app.use(express.json()); // Для парсинга JSON
app.use(express.urlencoded({ extended: true })); // Для form-data

// Подключение к базе данных
connectDB();

// Простой тестовый маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Blogging Platform API is running!',
    endpoints: {
      'GET /blogs': 'Get all blog posts',
      'GET /blogs/:id': 'Get single blog post',
      'POST /blogs': 'Create new blog post',
      'PUT /blogs/:id': 'Update blog post',
      'DELETE /blogs/:id': 'Delete blog post'
    },
    documentation: {
      'POST /blogs': 'Requires: {title: string, body: string, author?: string}',
      'PUT /blogs/:id': 'Requires at least one field to update'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const status = dbStatus === 1 ? 'healthy' : 'unhealthy';
  
  res.json({
    status: status,
    timestamp: new Date().toISOString(),
    database: dbStatus === 1 ? 'connected' : 'disconnected',
    dbStatus: dbStatus, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// 📌 Blog Routes
const blogRoutes = require('./src/routes/blogRoutes');
app.use('/blogs', blogRoutes);

// Обработка 404 - ТОЛЬКО ОДИН РАЗ!
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /blogs',
      'GET /blogs/:id',
      'POST /blogs',
      'PUT /blogs/:id',
      'DELETE /blogs/:id'
    ]
  });
});

// Глобальная обработка ошибок
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

// Запуск сервера только после подключения к БД
mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log(`\n✨ =========================================== ✨`);
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Database: ${mongoose.connection.name}`);
    console.log(`👤 User: ${mongoose.connection.user}`);
    console.log(`🔗 Connection: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`✨ =========================================== ✨\n`);
    
    console.log('📋 Available endpoints:');
    console.log(`   🌐 Main:      GET  http://localhost:${PORT}/`);
    console.log(`   ❤️  Health:    GET  http://localhost:${PORT}/health`);
    console.log(`   📖 Read All:  GET  http://localhost:${PORT}/blogs`);
    console.log(`   📝 Read One:  GET  http://localhost:${PORT}/blogs/:id`);
    console.log(`   ✨ Create:    POST http://localhost:${PORT}/blogs`);
    console.log(`   🔄 Update:    PUT  http://localhost:${PORT}/blogs/:id`);
    console.log(`   🗑️  Delete:    DELETE http://localhost:${PORT}/blogs/:id`);
    console.log('');
    console.log('⚡ Test with: curl -X GET http://localhost:' + PORT + '/blogs');
    console.log('');
  });
});

// Обработка graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Received SIGINT. Closing connections...');
  
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
  
  console.log('👋 Server shutting down');
  process.exit(0);
});

// Экспорт для тестирования
module.exports = app;