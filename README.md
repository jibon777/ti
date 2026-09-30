Markdown# 🎫 Internal Ticketing System (Jira Clone)

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-18.x-green?logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-15.0-blue?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" alt="Docker" />
</p>

Aplikasi manajemen tiket internal berbasis **Kanban Board** yang dirancang untuk mempermudah kolaborasi dan pelaporan isu antara tim **Developer** dan **QA**. Aplikasi ini dibangun dengan arsitektur microservices container berbasis **Docker Compose**.

---

## ✨ Fitur Utama

- 🔐 **Authentication & Role-based Access**: Login sederhana untuk membedakan identitas pengirim dan penerima tiket (Developer, QA, PM).
- 📋 **Kanban Board Layout**: Pembagian kolom status tiket visual: **To Do**, **In Progress**, dan **Done**.
- 🖐️ **Drag & Drop Interactive**: Menggeser tiket antar-kolom status secara real-time.
- 🔒 **Done-Ticket Locking**: Tiket berstatus **Done** otomatis berwarna hijau, bertanda khusus, dan terkunci dari aksi *drag & drop* untuk menjaga integritas audit log.
- 📷 **Drag & Drop Image Attachment**: Cukup *drag* file gambar dari komputer ke area deskripsi untuk mengunggah screenshot bug/bukti pekerjaan secara otomatis dengan pratinjau langsung.
- 💬 **2-Way Discussion (Comments)**: Fitur komentar dua arah pada detail tiket untuk memfasilitasi diskusi jika terdapat ketidaksesuaian pengerjaan.
- 📜 **Automatic Activity Log**: Pencatatan otomatis setiap riwayat perubahan status, komentar baru, dan waktu (*timestamp*) pengerjaan.

---

## 🛠️ Tech Stack

| Layer | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite) + Tailwind CSS | UI Interaktif modern dengan HTML5 Drag and Drop API |
| **Backend** | Node.js + Express.js | RESTful API server & File Static Serving |
| **Upload Handler** | Multer | Middleware upload attachment file gambar |
| **Database** | PostgreSQL 15 | Relational Database storage |
| **Orchestration**| Docker & Docker Compose | Containerization environment |

---

## 📁 Struktur Folder Project

```text
ticketing-app/
├── docker-compose.yml          # Konfigurasi container orchestra
├── database/
│   └── init.sql                # DDL Schema database & data dummy awal
├── backend/
│   ├── uploads/                # Direktori penampung file gambar yang diunggah
│   ├── Dockerfile              # Setup Docker environment Node.js
│   ├── index.js                # Server REST API & Logika Bisnis
│   └── package.json
└── frontend/
    ├── Dockerfile              # Setup Docker environment React Vite
    ├── package.json
    ├── tailwind.config.js      # Konfigurasi Styling Tailwind
    ├── postcss.config.js
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx             # Komponen Utama Kanban & Modal
        └── index.css           # Directive CSS Tailwind
👥 Akun Dummy (Kredensial Login)Gunakan akun berikut untuk menguji skenario komunikasi antara Developer dan QA:Nama UserEmailPasswordRoleBudi Developerbudi@example.compassword123DeveloperSiti QAsiti@example.compassword123QA⚡ Panduan Memulai (Quick Start)PrasyaratPastikan komputer Anda sudah terinstall:GitDocker DesktopLangkah Instalasi & JalankanClone RepositoriBashgit clone [https://github.com/username/ti.git](https://github.com/username/ti.git)
cd ti
Jalankan Aplikasi dengan DockerJalankan perintah berikut di folder root project:Bashdocker compose up --build
Akses AplikasiBuka browser dan navigasi ke URL berikut:Frontend Web UI: http://localhost:5173Backend REST API: http://localhost:5000/api/ticketsDatabase Postgres: localhost:5432🔌 Dokumentasi REST APIMethodEndpointDeskripsiPOST/api/auth/loginOtentikasi email & password userGET/api/usersMengambil daftar seluruh anggota timGET/api/ticketsMengambil seluruh tiket beserta activity log & komentarPOST/api/ticketsMembuat tiket baruPUT/api/tickets/:id/statusMemperbarui status tiket (To Do / In Progress / Done)POST/api/tickets/:id/commentsMenambahkan komentar/catatan baru pada tiketPOST/api/uploadMenangani unggahan file gambar dari drag & drop🧹 Reset & Rebuild ContainerJika Anda mengubah struktur schema pada file database/init.sql atau menambah paket dependency baru:Bash# Matikan container dan hapus volume database lama
docker compose down -v

# Rebuild dan jalankan ulang
docker compose up --build
📝 LisensiProject ini dibuat untuk kebutuhan internal dan pengembangan portofolio.