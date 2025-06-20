// server/index.js
// Purpose: Base Express server setup for bones_app using config.json

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

// ✅ Load config JSON instead of .env
const config = require('../config.json');
console.log('Loaded config:', config);

const app = express();

// ✅ Consistent: import db connection once, named `db`
const db = require('./db');

// ✅ Import admin tools router
const adminToolsRoutes = require('./routes/adminTools');

// ✅ Use SUBPATH from config — EXACTLY as before
let subpath = config.SUBPATH || '/';
if (!subpath.endsWith('/')) subpath += '/';

// ✅ Log TEST_KEY to prove config works
console.log('TEST_KEY from config:', config.TEST_KEY);

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(session({
  secret: config.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false
}));

// ✅ Test route — unchanged
app.get(`${subpath}api/hello`, (req, res) => {
  res.json({
    message: 'Hello from bones_app server!',
    configSubpath: subpath
  });
});

// ✅ Admin tools route — uses your good version
app.use(`${subpath}api/admin-tools`, adminToolsRoutes);

// ✅ DB test route — uses `db` consistently
app.get(`${subpath}api/db-test`, async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() AS now;');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error('DB test failed:', err);
    res.status(500).json({ error: 'DB connection failed' });
  }
});

// ✅ Serve static React build under SUBPATH
const buildPath = path.join(__dirname, '..', 'client', 'build');
app.use(subpath, express.static(buildPath));

// ✅ Use PORT from config OR env
const PORT = process.env.PORT || config.PORT || 4000;

const fs = require('fs');

const logLine = `PORT: ${PORT}\nSUBPATH: ${subpath}\n`;
fs.writeFileSync('./tmp/debug_log.txt', logLine);


// ✅ Start server with readable timestamp
app.listen(PORT, () => {
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
  });
  console.log(`Server running at http://localhost:${PORT}${subpath}`);
  console.log(`Expected test route: ${subpath}api/hello`);
  console.log(`Started at: ${timestamp}`);
  console.log('✅ Live config check:');
  console.log('PORT:', PORT);
  console.log('SUBPATH:', subpath);
  console.log('Full test route should be:', `${subpath}api/hello`);

});
