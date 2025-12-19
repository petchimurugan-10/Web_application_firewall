// database/db.js - SQLite Database Configuration
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the project root
const dbPath = path.join(__dirname, '..', 'blog.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Initialize database with tables and seed data
const initDatabase = () => {
  db.serialize(() => {
    // Create posts table
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating posts table:', err.message);
      } else {
        console.log('Posts table created or already exists');
      }
    });

    // Create comments table
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts (id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating comments table:', err.message);
      } else {
        console.log('Comments table created or already exists');
      }
    });

    // Seed initial blog posts
    db.get('SELECT COUNT(*) as count FROM posts', (err, row) => {
      if (err) {
        console.error('Error checking posts:', err.message);
        return;
      }

      if (row.count === 0) {
        console.log('Seeding initial blog posts...');
        
        const posts = [
          {
            title: 'Getting Started with Web Security',
            content: 'Web security is crucial for protecting user data and maintaining trust. In this article, we explore the basics of common vulnerabilities including SQL injection, cross-site scripting (XSS), and cross-site request forgery (CSRF). Understanding these threats is the first step in building secure web applications.'
          },
          {
            title: 'Understanding SQL Injection',
            content: 'SQL injection is one of the most common web application vulnerabilities. It occurs when user input is not properly sanitized before being used in SQL queries. Attackers can manipulate queries to access, modify, or delete data. The best defense is to use parameterized queries and never concatenate user input directly into SQL statements.'
          }
        ];

        const stmt = db.prepare('INSERT INTO posts (title, content) VALUES (?, ?)');
        posts.forEach(post => {
          stmt.run(post.title, post.content);
        });
        stmt.finalize();

        console.log('Initial posts seeded successfully');

        // Seed initial comments
        const comments = [
          { post_id: 1, author: 'Alice', content: 'Great introduction to web security!' },
          { post_id: 2, author: 'Bob', content: 'Very informative article on SQLi.' },
        ];

        const commentStmt = db.prepare('INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)');
        comments.forEach(comment => {
          commentStmt.run(comment.post_id, comment.author, comment.content);
        });
        commentStmt.finalize();

        console.log('Initial comments seeded successfully');
      }
    });
  });
};

module.exports = { db, initDatabase };
