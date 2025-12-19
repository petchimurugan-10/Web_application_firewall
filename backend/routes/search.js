// routes/search.js - Search Routes (INTENTIONALLY VULNERABLE TO SQL INJECTION)
const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// 🔴 VULNERABLE: SQL Injection endpoint
// This endpoint directly concatenates user input into the SQL query
// DO NOT USE THIS CODE IN PRODUCTION!
router.get('/', (req, res) => {
  const searchQuery = req.query.q || '';
  
  console.log('⚠️  VULNERABLE SEARCH - Query:', searchQuery);
  
  // DANGEROUS: Direct string concatenation - SQL Injection vulnerability!
  const vulnerableQuery = `SELECT * FROM posts WHERE title LIKE '%${searchQuery}%' OR content LIKE '%${searchQuery}%'`;
  
  console.log('⚠️  Executing vulnerable query:', vulnerableQuery);
  
  db.all(vulnerableQuery, [], (err, rows) => {
    if (err) {
      console.error('❌ SQL Error:', err.message);
      // In a real vulnerable app, we might expose this error message
      // which could leak database structure information
      return res.status(500).json({ 
        error: 'Database error',
        details: err.message // Exposing error details is also a vulnerability
      });
    }
    
    console.log(`✅ Query returned ${rows.length} results`);
    res.json(rows);
  });
});

/* 
  TESTING SQL INJECTION:
  
  Try these payloads in the search box:
  
  1. Basic SQLi test:
     ' OR '1'='1
  
  2. Union-based SQLi (to extract data):
     ' UNION SELECT id, author, content FROM comments --
  
  3. Comment out rest of query:
     test' OR 1=1 --
  
  4. Time-based blind SQLi:
     ' OR 1=1; SELECT CASE WHEN (1=1) THEN sqlite_version() ELSE '' END --
  
  5. Dangerous payload (be careful in test environment):
     '; DROP TABLE posts; --
*/

// SECURE VERSION (commented out - for comparison):
/*
router.get('/secure', (req, res) => {
  const searchQuery = req.query.q || '';
  
  // SAFE: Using parameterized query
  const secureQuery = 'SELECT * FROM posts WHERE title LIKE ? OR content LIKE ?';
  const searchParam = `%${searchQuery}%`;
  
  db.all(secureQuery, [searchParam, searchParam], (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
      return res.status(500).json({ error: 'Search failed' });
    }
    res.json(rows);
  });
});
*/

module.exports = router;
