# Inventory Management System API Documentation

Backend sistem manajemen inventaris untuk jurusan RPL dengan fitur autentikasi, manajemen barang, sistem peminjaman, dan export data.

## 🚀 Tech Stack
- Node.js & Express
- MongoDB & Mongoose
- JWT Authentication
- BCrypt Password Hashing
- ExcelJS & PDFKit untuk export data

## 📋 Prerequisites
- Node.js v14+
- MongoDB
- NPM/Yarn

## 🛠 Installation & Setup

1. Clone repository
```bash
git clone [repository-url]
cd [project-folder]
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/inventori
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
```

4. Seed database dengan admin dan sample items
```bash
node seeders/seeder.js
```
Ini akan membuat:
- Admin user (email: admin@rpl.com, password: admin123)
- 100 items dengan data random

5. Run development server
```bash
npm run dev
```

## 🔑 Authentication API Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
    "name": "Admin Name",
    "email": "admin@example.com",
    "phone": "+6281234567890",
    "class": "XII RPL 1",
    "password": "password123",
    "role": "admin"  // Optional, default: "user"
}
```
Response:
```json
{
    "status": "success",
    "token": "jwt_token_here",
    "data": {
        "user": {
            "name": "Admin Name",
            "email": "admin@example.com",
            "phone": "+6281234567890",
            "class": "XII RPL 1",
            "role": "admin"
        }
    }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "admin@example.com",
    "password": "password123"
}
```
Response:
```json
{
    "status": "success",
    "token": "jwt_token_here",
    "data": {
        "user": {
            "name": "Admin Name",
            "email": "admin@example.com",
            "role": "admin"
        }
    }
}
```

### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer jwt_token_here
```
Response:
```json
{
    "status": "success",
    "data": {
        "user": {
            "name": "Admin Name",
            "email": "admin@example.com",
            "phone": "+6281234567890",
            "class": "XII RPL 1",
            "role": "admin"
        }
    }
}
```

### Validate Token
```http
GET /api/auth/validate-token
Authorization: Bearer jwt_token_here
```
Response:
```json
{
    "status": "success",
    "data": {
        "user": {
            "name": "Admin Name",
            "email": "admin@example.com",
            "role": "admin"
        }
    }
}
```

## 📦 Inventory Management API Endpoints

### Get All Items (Public)
```http
GET /api/items
```

#### Query Parameters
- **Filtering:**
  ```
  /api/items?category=Hardware
  /api/items?condition=Baik
  /api/items?location=Lab 1
  /api/items?category=Hardware&condition=Baik
  ```
- **Sorting:**
  ```
  /api/items?sort=name        // ascending
  /api/items?sort=-name       // descending
  /api/items?sort=name,-createdAt
  ```
- **Pagination:**
  ```
  /api/items?page=1&limit=10
  ```
- **Field Selection:**
  ```
  /api/items?fields=name,category,status
  ```

Response:
```json
{
    "status": "success",
    "results": 2,
    "total": 50,
    "data": {
        "items": [
            {
                "code": "ITM20240320",
                "name": "Laptop Dell XPS 13",
                "category": "Hardware",
                "specifications": {
                    "processor": "Intel i7 11th Gen",
                    "ram": "16GB",
                    "storage": "512GB SSD"
                },
                "condition": "Baik",
                "status": "Tersedia",
                "location": "Lab 1"
            }
        ]
    }
}
```

### Get Single Item (Public)
```http
GET /api/items/:id
```

### Create New Item (Admin Only)
```http
POST /api/items
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
    "name": "Laptop Dell XPS 13",
    "category": "Hardware",
    "specifications": {
        "processor": "Intel i7 11th Gen",
        "ram": "16GB",
        "storage": "512GB SSD"
    },
    "condition": "Baik",
    "status": "Tersedia",
    "location": "Lab 1",
    "purchaseInfo": {
        "price": 15000000,
        "date": "2024-03-20",
        "warranty": "2025-03-20"
    },
    "notes": "Untuk development dan testing"
}
```

### Update Item (Admin Only)
```http
PATCH /api/items/:id
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
    "condition": "Rusak Ringan",
    "status": "Dalam Perbaikan",
    "notes": "Keyboard bermasalah"
}
```

### Delete Item (Admin Only)
```http
DELETE /api/items/:id
Authorization: Bearer jwt_token_here
```

### Get Statistics (Admin Only)
```http
GET /api/items/stats
Authorization: Bearer jwt_token_here
```

## 📝 Borrowing System API Endpoints

### Create Borrow Request (User)
```http
POST /api/borrows
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
    "items": [
        {
            "item": "item_id_1",
            "condition": "Baik",
            "notes": "Dengan charger"
        },
        {
            "item": "item_id_2",
            "condition": "Baik"
        }
    ],
    "dueDate": "2024-03-25",
    "purpose": "Praktikum Database"
}
```

### Get My Borrows (User)
```http
GET /api/borrows/my
Authorization: Bearer jwt_token_here
```

### Get All Borrows (Admin)
```http
GET /api/borrows
Authorization: Bearer jwt_token_here
```

Query Parameters:
- **Filter by status:**
  ```
  /api/borrows?status=pending
  /api/borrows?status=borrowed
  ```
- **Filter by date:**
  ```
  /api/borrows?startDate=2024-03-01&endDate=2024-03-31
  ```
- **Pagination:**
  ```
  /api/borrows?page=1&limit=10
  ```

### Update Borrow Status (Admin)
```http
PATCH /api/borrows/:id
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
    "status": "approved",  // or "rejected", "borrowed", "returned"
    "returnCondition": "Baik",  // required if status is "returned"
    "returnNotes": "Dikembalikan dalam kondisi baik"
}
```

### Get Borrow Statistics (Admin)
```http
GET /api/borrows/stats
Authorization: Bearer jwt_token_here
```

## 📝 Data Validation

### User Model
- **name**: Required, string
- **email**: Required, unique, valid email format
- **phone**: Required, valid phone number format
- **class**: Required, string
- **role**: Enum ["user", "admin"], default "user"
- **password**: Required, min 8 characters

### Item Model
- **code**: Auto-generated, unique
- **name**: Required, string
- **category**: Required, enum ["Hardware", "Peripheral", "Development Tools", "Software License", "Lab Equipment"]
- **specifications**: Optional, key-value pairs
- **condition**: Required, enum ["Baik", "Rusak Ringan", "Rusak Berat"]
- **status**: Required, enum ["Tersedia", "Dipinjam", "Dalam Perbaikan"]
- **location**: Required, enum ["Lab 1", "Lab 2", "Lab 3", "Gudang"]
- **purchaseInfo**:
  - price: Required, number
  - date: Required, date
  - warranty: Required, date
- **images**: Optional, array of strings (URLs)
- **notes**: Optional, string

### Borrow Model
- **borrowCode**: Auto-generated, unique
- **user**: Required, reference to User
- **items**: Array of:
  - item: Required, reference to Item
  - condition: Required, enum ["Baik", "Rusak Ringan", "Rusak Berat"]
  - notes: Optional, string
- **borrowDate**: Required, date, default: now
- **dueDate**: Required, date
- **returnDate**: Optional, date
- **status**: Required, enum ["pending", "approved", "rejected", "borrowed", "returned", "overdue"]
- **purpose**: Required, string
- **returnCondition**: Optional, enum ["Baik", "Rusak Ringan", "Rusak Berat"]
- **returnNotes**: Optional, string

## 🔐 Authentication & Authorization

- JWT token digunakan untuk autentikasi
- Token harus disertakan di header untuk endpoint protected:
  ```
  Authorization: Bearer jwt_token_here
  ```
- Role-based access control:
  - Admin: Akses penuh ke semua endpoint
  - User: Dapat membuat dan melihat peminjaman sendiri
  - Public: Akses ke endpoint public saja

## ⚠️ Error Handling

API akan mengembalikan error dengan format:
```json
{
    "status": "fail",
    "message": "Error message here"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## 🌱 Database Seeder

Untuk memudahkan testing, sistem dilengkapi dengan seeder yang akan membuat:
1. Admin user default
2. 100 items dengan data random

Cara menggunakan seeder:
```bash
node seeders/seeder.js
```

Default admin credentials:
- Email: admin@rpl.com
- Password: admin123

Items yang di-generate akan memiliki:
- Kategori random (Hardware, Peripheral, dll)
- Spesifikasi sesuai kategori
- Harga antara 500rb - 20jt
- Kondisi random
- Lokasi random
- Tanggal pembelian dalam 1 tahun terakhir
- Garansi 1 tahun dari tanggal pembelian

## 📊 Export Data API Endpoints

### Export Items ke Excel (Admin Only)
```http
GET /api/export/items/excel
Authorization: Bearer jwt_token_here
```
Menghasilkan file Excel dengan:
- Sheet "Inventory Items"
- Kolom: Kode, Nama, Kategori, Kondisi, Status, Lokasi, Harga, dll
- Format harga dalam Rupiah
- Format tanggal dalam WIB
- Styling header dengan background abu-abu
- Nama file: `Inventory_YYYY-MM-DD.xlsx`

### Export Items ke PDF (Admin Only)
```http
GET /api/export/items/pdf
Authorization: Bearer jwt_token_here
```
Menghasilkan file PDF dengan:
- Judul "Laporan Inventaris RPL"
- Tanggal cetak (WIB)
- Tabel items (15 items per halaman)
- Kolom: Kode, Nama, Kategori, Kondisi, Status
- Total items di akhir laporan
- Nama file: `Inventory_YYYY-MM-DD.pdf`

### Export Peminjaman ke Excel (Admin Only)
```http
GET /api/export/borrows/excel
Authorization: Bearer jwt_token_here
```
Menghasilkan file Excel dengan:
- Sheet "Peminjaman"
- Kolom: Kode Pinjam, Peminjam, Kelas, Barang, Tanggal Pinjam, Tenggat, Status, dll
- Format tanggal dalam WIB
- List barang yang dipinjam dalam satu cell
- Styling header dengan background abu-abu
- Nama file: `Peminjaman_YYYY-MM-DD.xlsx`

### Export Peminjaman ke PDF (Admin Only)
```http
GET /api/export/borrows/pdf
Authorization: Bearer jwt_token_here
```
Menghasilkan file PDF dengan:
- Judul "Laporan Peminjaman Inventaris RPL"
- Tanggal cetak (WIB)
- Tabel peminjaman (12 peminjaman per halaman)
- Kolom: Kode, Peminjam, Barang, Status, Tenggat
- Total peminjaman di akhir laporan
- Nama file: `Peminjaman_YYYY-MM-DD.pdf`

## ✅ Fitur yang Sudah Diimplementasikan

### 1. Authentication System
- [x] User registration dan login
- [x] Role-based access (admin dan user)
- [x] Token validation
- [x] User profile (me) endpoint
- [x] JWT-based authentication
- [x] Password hashing dengan BCrypt

### 2. Item Management
- [x] Complete CRUD operations
- [x] Model item dengan fields lengkap
- [x] Advanced filtering & sorting
- [x] Public access untuk view
- [x] Admin-only untuk modifikasi
- [x] Statistik items
- [x] Auto-generate kode item
- [x] Validasi input

### 3. Borrowing System
- [x] Model peminjaman lengkap
- [x] Multiple items per peminjaman
- [x] Status tracking otomatis
- [x] Condition tracking
- [x] Due date management
- [x] Statistik peminjaman
- [x] Role-based permissions
- [x] Validasi ketersediaan item
- [x] Auto-populate data terkait

### 4. Data Export
- [x] Export items ke Excel
- [x] Export items ke PDF
- [x] Export peminjaman ke Excel
- [x] Export peminjaman ke PDF
- [x] Format data dalam Rupiah dan WIB
- [x] Auto-paging untuk PDF
- [x] Styling untuk Excel

### 5. Extra Features
- [x] Timezone WIB untuk semua operasi
- [x] Database seeder untuk testing
- [x] Dokumentasi API lengkap
- [x] Error handling
- [x] Input validation
- [x] Auto-update status overdue

## ❌ Fitur yang Belum Diimplementasikan

### 1. Email Notifications
- [ ] Setup Nodemailer
- [ ] Template email
- [ ] Notifikasi peminjaman baru
- [ ] Notifikasi status update
- [ ] Due date reminder
- [ ] Overdue notice

### 2. Security & Performance
- [ ] Rate limiting untuk API
- [ ] API key untuk public access
- [ ] Request validation
- [ ] Response compression
- [ ] Cache layer

### 3. Testing & Monitoring
- [ ] Unit testing dengan Jest
- [ ] Integration testing
- [ ] API testing
- [ ] Logging system
- [ ] Performance monitoring
- [ ] Error tracking

### 4. Backup & Recovery
- [ ] Scheduled MongoDB backups
- [ ] Cloud backup
- [ ] Backup rotation
- [ ] Recovery procedure
- [ ] Data versioning
