const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Tidak ada gambar yang diupload' });
  res.json({ imageUrl: `http://localhost:5000/uploads/${req.file.filename}` });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (result.rows.length > 0) res.json({ success: true, user: result.rows[0] });
    else res.status(401).json({ success: false, message: 'Email atau password salah!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET TICKETS (Termasuk logs & comments)
app.get('/api/tickets', async (req, res) => {
  try {
    const query = `
      SELECT t.id, t.title, t.description, t.status, t.created_at, t.updated_at, t.logs, t.comments, u.name as assignee 
      FROM tickets t LEFT JOIN users u ON t.assignee_id = u.id ORDER BY t.id ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tickets', async (req, res) => {
  const { title, description, status, assignee_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tickets (title, description, status, assignee_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, status, assignee_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tickets/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, user_name } = req.body;
  try {
    const ticketRes = await pool.query('SELECT status, logs FROM tickets WHERE id = $1', [id]);
    if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Tiket tidak ditemukan' });
    
    const currentStatus = ticketRes.rows[0].status;
    let logs = [];
    try { logs = JSON.parse(ticketRes.rows[0].logs || '[]'); } catch(e) {}

    if (currentStatus === 'Done') return res.status(403).json({ error: 'Tiket sudah Done.' });

    logs.push({ user: user_name, action: `Status diubah dari ${currentStatus} ke ${status}`, time: new Date().toISOString() });

    await pool.query('UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP, logs = $2 WHERE id = $3', [status, JSON.stringify(logs), id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ENDPOINT BARU: TAMBAH KOMENTAR
app.post('/api/tickets/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { user_name, text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Komentar tidak boleh kosong' });
  }

  try {
    const ticketRes = await pool.query('SELECT comments, logs FROM tickets WHERE id = $1', [id]);
    if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Tiket tidak ditemukan' });

    let comments = [];
    try { comments = JSON.parse(ticketRes.rows[0].comments || '[]'); } catch(e) {}

    let logs = [];
    try { logs = JSON.parse(ticketRes.rows[0].logs || '[]'); } catch(e) {}

    const newComment = {
      user: user_name,
      text: text.trim(),
      time: new Date().toISOString()
    };
    comments.push(newComment);

    // Otomatis catat di Activity Log bahwa ada komentar baru
    logs.push({
      user: user_name,
      action: 'Menambahkan komentar',
      time: new Date().toISOString()
    });

    await pool.query(
      'UPDATE tickets SET comments = $1, logs = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [JSON.stringify(comments), JSON.stringify(logs), id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend API running on port ${PORT}`));