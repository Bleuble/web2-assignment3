const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Body is required'],
    minlength: [10, 'Body must be at least 10 characters long']
  },
  author: {
    type: String,
    default: 'Anonymous',
    trim: true
  }
}, {
  timestamps: true 
});


blogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;