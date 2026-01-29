// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    console.log('📡 URI:', process.env.MONGODB_URI ? 
      process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') : 
      'Not set');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://danochka:QWERrewq123@cluster0.ij4cde5.mongodb.net/blog_database?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000, 
    });
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Port: ${conn.connection.port || 'Cloud (Atlas)'}`);
    console.log(`   Version: ${conn.connection.version || 'Unknown'}`);
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed!`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Name: ${error.name}`);
    
    
    if (error.message.includes('Authentication failed')) {
      console.error('💡 Tip: Check your MongoDB Atlas username and password');
      console.error('💡 Tip: Make sure your IP is whitelisted in Network Access');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Tip: Check your internet connection');
      console.error('💡 Tip: The MongoDB Atlas cluster might be down');
    } else if (error.message.includes('timed out')) {
      console.error('💡 Tip: Network timeout. Try again or check firewall');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;