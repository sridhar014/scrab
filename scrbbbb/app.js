/*
Single-file Node.js + Express app that lets users upload an image + details
and makes those uploads visible ONLY to an admin.

Features:
- Frontend: simple upload form (name, email, description, image)
- Upload handling with multer (saves image to ./uploads)
- Metadata persisted to ./uploads/data.json
- Admin-only interface at /admin protected with HTTP Basic Auth
  (use env vars ADMIN_USER and ADMIN_PASS; defaults provided)
- Minimal styling and comments

How to run:
1. Save this file as app.js
2. mkdir uploads
3. npm init -y
4. npm i express multer express-basic-auth body-parser
5. (Optional) set ADMIN_USER and ADMIN_PASS env vars. Example on Linux/mac:
   export ADMIN_USER=admin
   export ADMIN_PASS=yourStrongPassword
   On Windows (PowerShell): $env:ADMIN_USER = "admin"; $env:ADMIN_PASS = "pass"
6. node app.js
7. Open http://localhost:3000/ to upload. Admin at http://localhost:3000/admin

Security notes:
- This is a minimal example for learning. For production:
  * Use HTTPS
  * Use strong authentication and sessions or OAuth
  * Validate and sanitize inputs
  * Store files in cloud storage (S3) and metadata in a real DB
*/

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure upload storage
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // unique filename: timestamp-originalname
    const unique = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    cb(null, unique);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir)); // serve uploaded images to admin only route will be protected

// Helper: read/write metadata
const dataFile = path.join(uploadDir, 'data.json');
function readData() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
function writeData(arr) {
  fs.writeFileSync(dataFile, JSON.stringify(arr, null, 2), 'utf8');
}

// Public upload form
app.get('/', (req, res) => {
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Upload (visible to admin only)</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:40px auto;padding:10px}
    form{display:flex;flex-direction:column;gap:8px}
    label{font-weight:600}
    input[type=text],textarea{padding:8px;border:1px solid #ccc;border-radius:6px}
    input[type=file]{padding:6px}
    button{padding:10px;border-radius:6px;border:0;background:#2563eb;color:white;font-weight:600}
    .note{font-size:0.9em;color:#555}
  </style>
</head>
<body>
  <h1>Upload — Admin Only View</h1>
  <p class="note">Files and details submitted here will be visible only to the site administrator at <code>/admin</code>.</p>
  <form action="/upload" method="post" enctype="multipart/form-data">
    <label for="name">Name</label>
    <input id="name" name="name" required type="text" placeholder="Your name" />

    <label for="email">Email</label>
    <input id="email" name="email" required type="text" placeholder="you@example.com" />

    <label for="desc">Description / Details</label>
    <textarea id="desc" name="description" rows="4" placeholder="Enter details" required></textarea>

    <label for="image">Image (max 5MB)</label>
    <input id="image" name="image" required type="file" accept="image/*" />

    <button type="submit">Upload</button>
  </form>

  <hr />
  <p class="note">If you're the admin, go to <a href="/admin">Admin Dashboard</a> (protected).</p>
</body>
</html>`);
});

// Handle upload (public) — store metadata
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const { name, email, description } = req.body;
  const newItem = {
    id: Date.now(),
    name: name || '',
    email: email || '',
    description: description || '',
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploadedAt: new Date().toISOString()
  };

  const arr = readData();
  arr.unshift(newItem); // newest first
  writeData(arr);

  res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Uploaded</title></head><body style="font-family:Arial,Helvetica,sans-serif;margin:30px"><h2>Upload successful</h2><p>Your file has been uploaded and will be visible only to the admin.</p><p><a href="/">Upload another</a> · <a href="/admin">Admin (protected)</a></p></body></html>`);
});

// Basic Auth protection for admin routes
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'secret123';

app.use('/admin', basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASS },
  challenge: true,
  realm: 'Admin Area'
}));

// Admin dashboard — list uploads
app.get('/admin', (req, res) => {
  const items = readData();
  // Build HTML list of items: link to /uploads/<filename>
  const rows = items.map(it => {
    return `
      <div style="border:1px solid #eee;padding:12px;border-radius:8px;margin-bottom:12px;display:flex;gap:12px;align-items:flex-start">
        <div style="width:160px;height:120px;flex:0 0 160px;overflow:hidden;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#fafafa">
          <img src="/uploads/${encodeURIComponent(it.filename)}" style="max-width:100%;max-height:100%;object-fit:cover" alt="${escapeHtml(it.description)}" />
        </div>
        <div style="flex:1">
          <div style="font-weight:700">${escapeHtml(it.name)} <span style="font-weight:400;color:#666">(${escapeHtml(it.email)})</span></div>
          <div style="margin-top:6px">${escapeHtml(it.description)}</div>
          <div style="margin-top:8px;font-size:0.85em;color:#666">Uploaded: ${escapeHtml(it.uploadedAt)} — ${Math.round(it.size/1024)} KB</div>
        </div>
      </div>
    `;
  }).join('\n') || '<p>No uploads yet.</p>';

  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Admin — Uploaded Items</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;max-width:900px;margin:24px auto;padding:10px} a.button{display:inline-block;padding:8px 12px;background:#111;color:#fff;border-radius:6px;text-decoration:none}</style>
</head>
<body>
  <h1>Admin Dashboard</h1>
  <p><a class="button" href="/">Site Upload Page</a> <span style="margin-left:12px;color:#666">(logged in as ${ADMIN_USER})</span></p>
  <section style="margin-top:18px">${rows}</section>
</body>
</html>`);
});

// small html-escape helper for templates
function escapeHtml(str){
  if(!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`Admin user: ${ADMIN_USER} — change ADMIN_PASS via env var!`);
});
