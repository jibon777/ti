DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'User'
);

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'To Do',
    assignee_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logs TEXT DEFAULT '[]',
    comments TEXT DEFAULT '[]' -- Kolom untuk menyimpan array komentar JSON
);

-- Insert Dummy Users
INSERT INTO users (name, email, password, role) VALUES 
('Budi Developer', 'budi@example.com', 'password123', 'Developer'),
('Siti QA', 'siti@example.com', 'password123', 'QA');

-- Insert Dummy Tickets
INSERT INTO tickets (title, description, status, assignee_id, logs, comments) VALUES 
('Setup Repository', 'Buat repositori Git dan branch awal', 'Done', 1, '[{"user": "Budi Developer", "action": "Tiket diselesaikan", "time": "2026-09-29T10:00:00Z"}]', '[]'),
('Fix Login Bug', 'User tidak bisa login menggunakan email', 'In Progress', 1, '[]', '[{"user": "Siti QA", "text": "Mohon dicek kembali, error terjadi saat email menggunakan huruf kapital.", "time": "2026-09-29T11:00:00Z"}]'),
('Test Modul Pembayaran', 'Pastikan gateway pembayaran merespon 200 OK', 'To Do', 2, '[]', '[]');