// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./snack_data.db');

// Create a table to store snack data
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS snack_data (id INTEGER PRIMARY KEY AUTOINCREMENT, snack TEXT)');
});

module.exports = db;
