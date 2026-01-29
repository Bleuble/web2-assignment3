const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5001/api'  // Added /api
    : '/api';  // Added /api for production

// DOM Elements
const blogForm = document.getElementById('blogForm');
const blogList = document.getElementById('blogList');
const totalPostsElement = document.getElementById('totalPosts');
const submitBtn = document.getElementById('submitBtn');
const updateBtn = document.getElementById('updateBtn');
const clearBtn = document.getElementById('clearBtn');
const serverStatus = document.getElementById('serverStatus');
const serverText = document.getElementById('serverText');
const dbStatus = document.getElementById('dbStatus');
const dbText = document.getElementById('dbText');

// Current blog being edited
let currentBlogId = null;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    checkServerHealth();
    loadBlogs();
    
    // Form submission
    blogForm.addEventListener('submit', handleFormSubmit);
    
    // Clear form button
    clearBtn.addEventListener('click', clearForm);
});

// Check server health
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.database === 'connected') {
            serverStatus.className = 'status-indicator status-connected';
            serverText.textContent = 'Connected';
            dbStatus.className = 'status-indicator status-connected';
            dbText.textContent = 'Connected';
            showNotification('✅ Server and database are connected', 'success');
        } else {
            serverStatus.className = 'status-indicator status-disconnected';
            serverText.textContent = 'Disconnected';
            dbStatus.className = 'status-indicator status-disconnected';
            dbText.textContent = 'Disconnected';
            showNotification('⚠️ Database connection issue', 'error');
        }
    } catch (error) {
        console.error('Health check failed:', error);
        serverStatus.className = 'status-indicator status-disconnected';
        serverText.textContent = 'Disconnected';
        dbStatus.className = 'status-indicator status-disconnected';
        dbText.textContent = 'Disconnected';
        showNotification('❌ Cannot connect to server', 'error');
    }
}

// Load all blogs
async function loadBlogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs`);
        const result = await response.json();
        
        if (result.success) {
            renderBlogs(result.data);
            totalPostsElement.textContent = result.count;
        } else {
            showNotification('Failed to load blogs', 'error');
        }
    } catch (error) {
        console.error('Error loading blogs:', error);
        blogList.innerHTML = `
            <div class="error">
                <p>Error loading blogs. Please check if the server is running.</p>
                <p>Make sure to start the server with: <code>node app.js</code></p>
            </div>
        `;
        showNotification('Error loading blogs', 'error');
    }
}

// Render blogs to the page
function renderBlogs(blogs) {
    if (!blogs || blogs.length === 0) {
        blogList.innerHTML = '<div class="no-blogs">No blog posts yet. Create one above! 📝</div>';
        return;
    }
    
    const blogsHTML = blogs.map(blog => `
        <div class="blog-card" data-id="${blog._id}">
            <h3 class="blog-title">${blog.title}</h3>
            <p class="blog-body">${blog.body.substring(0, 150)}${blog.body.length > 150 ? '...' : ''}</p>
            <div class="blog-meta">
                <span class="blog-author">👤 ${blog.author}</span>
                <span class="blog-date">📅 ${new Date(blog.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="blog-actions">
                <button class="btn-edit" onclick="editBlog('${blog._id}')">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteBlog('${blog._id}')">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
    
    blogList.innerHTML = blogsHTML;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value || 'Anonymous';
    const body = document.getElementById('body').value;
    
    if (!title || !body) {
        showNotification('Title and content are required!', 'error');
        return;
    }
    
    const blogData = { title, body, author };
    
    try {
        if (currentBlogId) {
            // Update existing blog
            await updateBlog(currentBlogId, blogData);
        } else {
            // Create new blog
            await createBlog(blogData);
        }
    } catch (error) {
        showNotification('Error saving blog: ' + error.message, 'error');
    }
}

// Create new blog
async function createBlog(blogData) {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(blogData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Blog post created successfully!', 'success');
            clearForm();
            loadBlogs();
        } else {
            throw new Error(result.error || 'Failed to create blog');
        }
    } catch (error) {
        throw error;
    }
}

// Update existing blog
async function updateBlog(id, blogData) {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(blogData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Blog post updated successfully!', 'success');
            clearForm();
            loadBlogs();
        } else {
            throw new Error(result.error || 'Failed to update blog');
        }
    } catch (error) {
        throw error;
    }
}

// Edit blog
async function editBlog(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs/${id}`);
        const result = await response.json();
        
        if (result.success) {
            const blog = result.data;
            document.getElementById('blogId').value = blog._id;
            document.getElementById('title').value = blog.title;
            document.getElementById('author').value = blog.author;
            document.getElementById('body').value = blog.body;
            
            currentBlogId = blog._id;
            submitBtn.style.display = 'none';
            updateBtn.style.display = 'block';
            
            // Scroll to form
            document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
            showNotification('✏️ Now editing blog post', 'info');
        }
    } catch (error) {
        showNotification('Error loading blog for editing', 'error');
    }
}

// Delete blog
async function deleteBlog(id) {
    if (!confirm('Are you sure you want to delete this blog post?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Blog post deleted successfully!', 'success');
            loadBlogs();
            
            // If we're editing the deleted blog, clear the form
            if (currentBlogId === id) {
                clearForm();
            }
        } else {
            throw new Error(result.error || 'Failed to delete blog');
        }
    } catch (error) {
        showNotification('Error deleting blog: ' + error.message, 'error');
    }
}

// Clear form
function clearForm() {
    document.getElementById('blogForm').reset();
    document.getElementById('blogId').value = '';
    currentBlogId = null;
    submitBtn.style.display = 'block';
    updateBtn.style.display = 'none';
}

// Show notification
function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Export functions for global use
window.editBlog = editBlog;
window.deleteBlog = deleteBlog;

// Add update button functionality
updateBtn.addEventListener('click', () => {
    document.getElementById('blogForm').dispatchEvent(new Event('submit'));
});