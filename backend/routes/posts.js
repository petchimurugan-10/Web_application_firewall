// routes/posts.js - Blog Posts Routes
const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// GET all posts
router.get('/', (req, res) => {
  const query = 'SELECT * FROM posts ORDER BY created_at DESC';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching posts:', err.message);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
    res.json(rows);
  });
});

// GET single post by ID
router.get('/:id', (req, res) => {
  const postId = req.params.id;
  
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) {
      console.error('Error fetching post:', err.message);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  });
});

// CREATE new post (bonus feature for testing)
router.post('/', (req, res) => {
  const { title, content } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const query = 'INSERT INTO posts (title, content) VALUES (?, ?)';
  
  db.run(query, [title, content], function(err) {
    if (err) {
      console.error('Error creating post:', err.message);
      return res.status(500).json({ error: 'Failed to create post' });
    }
    
    res.status(201).json({ 
      id: this.lastID, 
      title, 
      content,
      message: 'Post created successfully' 
    });
  });
});

module.exports = router;
