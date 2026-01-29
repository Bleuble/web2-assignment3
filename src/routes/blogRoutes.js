const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// 📌 POST /blogs - Create a new blog post
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /blogs - Request received');
    console.log('📦 Request body:', req.body);
    
    const { title, body, author } = req.body;

    
    if (!title || !body) {
      console.log('❌ Validation failed: Title or body missing');
      return res.status(400).json({
        success: false,
        error: 'Title and body are required fields'
      });
    }

    
    const blog = new Blog({
      title,
      body,
      author: author || 'Anonymous'
    });

    console.log('💾 Attempting to save blog to database...');
    
    
    const savedBlog = await blog.save();
    
    console.log('✅ Blog saved successfully:', savedBlog._id);
    console.log('📊 Full saved document:', savedBlog);

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: savedBlog
    });

  } catch (error) {
    console.error('🔥 POST Error:', error);
    
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors
      });
    }

    
    if (error.name === 'MongoServerError') {
      console.error('🗄️ MongoDB Server Error:', error.code, error.message);
    }

    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});


router.get('/', async (req, res) => {
  try {
    console.log('📖 GET /blogs - Fetching all blogs');
    
    const blogs = await Blog.find().sort({ createdAt: -1 }); // Сортировка: новые сначала
    
    console.log(`📚 Found ${blogs.length} blogs`);
    console.log('📊 Blogs:', blogs);

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });

  } catch (error) {
    console.error('🔥 GET All Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});


router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 GET /blogs/:id - Looking for blog with ID:', req.params.id);
    
    const blog = await Blog.findById(req.params.id);

    console.log('📊 Found blog:', blog ? 'YES' : 'NO');

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: blog
    });

  } catch (error) {
    console.error('🔥 GET by ID Error:', error);
    
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid blog ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});


router.put('/:id', async (req, res) => {
  try {
    console.log('🔄 PUT /blogs/:id - Updating blog with ID:', req.params.id);
    console.log('📦 Update data:', req.body);
    
    const { title, body, author } = req.body;

    
    if (!title && !body && !author) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (title, body, or author) is required for update'
      });
    }

    
    const updateData = {};
    if (title) updateData.title = title;
    if (body) updateData.body = body;
    if (author !== undefined) updateData.author = author;

    
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    console.log('📊 Updated blog:', updatedBlog);

    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: updatedBlog
    });

  } catch (error) {
    console.error('🔥 PUT Error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid blog ID format'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ DELETE /blogs/:id - Deleting blog with ID:', req.params.id);
    
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);

    console.log('📊 Deleted blog:', deletedBlog);

    if (!deletedBlog) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
      data: deletedBlog
    });

  } catch (error) {
    console.error('🔥 DELETE Error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid blog ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

module.exports = router;