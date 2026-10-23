// server/src/data/sqlite.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'roompeek.sqlite');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // 1. Tạo các bảng nếu chưa có
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      building TEXT NOT NULL,
      floor INTEGER NOT NULL,
      capacity INTEGER NOT NULL,
      category TEXT DEFAULT 'Phòng học nhóm'
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentEmail TEXT,
      roomId TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      memberCount INTEGER DEFAULT 1,
      status TEXT DEFAULT 'BOOKED',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (roomId) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS penalties (
      studentId TEXT PRIMARY KEY,
      noShowCount INTEGER DEFAULT 0,
      lateCheckoutCount INTEGER DEFAULT 0,
      banUntil TEXT,
      isBannedPermanent INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS penalty_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL,
      date TEXT NOT NULL,
      reason TEXT NOT NULL,
      FOREIGN KEY (studentId) REFERENCES penalties(studentId)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      studentId TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      fullName TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_locks (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      lockType TEXT NOT NULL,
      date TEXT,
      startTime TEXT,
      endTime TEXT,
      reason TEXT,
      lockedAt TEXT NOT NULL,
      lockedBy TEXT,
      FOREIGN KEY (roomId) REFERENCES rooms(id)
    );
  `);

  // Migration: Kiểm tra và bổ sung cột role trong bảng users nếu chưa có
  const userCols = db.pragma('table_info(users)');
  if (!userCols.some(col => col.name === 'role')) {
    db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'").run();
  }

  // Cấp quyền Admin cho tài khoản hiện có ITITIU25055
  try {
    db.prepare("UPDATE users SET role = 'admin' WHERE UPPER(studentId) = 'ITITIU25055'").run();
  } catch (e) {}

  // Tạo tài khoản admin mặc định: admin@student.hcmiu.edu.vn / 123456 (MSSV: ADMIN001)
  try {
    const adminCheck = db.prepare("SELECT * FROM users WHERE UPPER(studentId) = 'ADMIN001' OR LOWER(email) = 'admin@student.hcmiu.edu.vn'").get();
    if (!adminCheck) {
      db.prepare(`
        INSERT INTO users (id, studentId, email, fullName, password, role, createdAt)
        VALUES ('USR_ADMIN_001', 'ADMIN001', 'admin@student.hcmiu.edu.vn', 'Quản Trị Viên (Admin)', '123456', 'admin', ?)
      `).run(new Date().toISOString());

      const penCheck = db.prepare('SELECT * FROM penalties WHERE UPPER(studentId) = ?').get('ADMIN001');
      if (!penCheck) {
        db.prepare(`
          INSERT INTO penalties (studentId, noShowCount, lateCheckoutCount, banUntil, isBannedPermanent)
          VALUES ('ADMIN001', 0, 0, NULL, 0)
        `).run();
      }
    }
  } catch (e) {}

  // 2. Kiểm tra số lượng phòng hiện tại
  const countRow = db.prepare('SELECT COUNT(*) as count FROM rooms').get();

  // Nếu số phòng < 50, ta sẽ nạp danh sách 122 phòng chuẩn
  if (countRow.count < 50) {
    db.prepare('DELETE FROM rooms').run();

    const insertRoom = db.prepare(`
      INSERT INTO rooms (id, name, building, floor, capacity, category)
      VALUES (@id, @name, @building, @floor, @capacity, @category)
    `);

    const fullRooms = [];

    // Cấu hình các dãy tòa nhà và số tầng
    const buildingsConfig = [
      { code: 'A1', floors: 7, roomsPerFloor: 5, prefix: 'A1.' },
      { code: 'A2', floors: 7, roomsPerFloor: 5, prefix: 'A2.' },
      { code: 'LA1', floors: 4, roomsPerFloor: 4, prefix: 'LA1.' },
      { code: 'LA2', floors: 4, roomsPerFloor: 4, prefix: 'LA2.' },
      { code: 'B', floors: 5, roomsPerFloor: 4, prefix: 'B.' },
    ];

    buildingsConfig.forEach(b => {
      for (let f = 1; f <= b.floors; f++) {
        for (let r = 1; r <= b.roomsPerFloor; r++) {
          const roomNum = `${f}${r.toString().padStart(2, '0')}`;
          const roomId = `${b.prefix}${roomNum}`;

          let category = 'Phòng học';
          let capacity = 30;

          if (b.code === 'LA1' || b.code === 'LA2') {
            category = 'Phòng Lab';
            capacity = 20 + ((f + r) % 3) * 5;
          } else {
            if (r === 1) {
              category = 'Giảng đường';
              const capOptions = [80, 100, 120, 140, 150];
              capacity = capOptions[(f + r) % capOptions.length];
            } else if (r === 2) {
              category = 'Phòng Lab';
              capacity = 20 + ((f + r) % 3) * 5;
            } else {
              category = 'Phòng học';
              capacity = 30 + ((f + r) % 2) * 5;
            }
          }

          fullRooms.push({
            id: roomId,
            name: `${category} ${roomId}`,
            building: b.code,
            floor: f,
            capacity,
            category
          });
        }
      }
    });

    const insertMany = db.transaction((rooms) => {
      for (const room of rooms) {
        insertRoom.run(room);
      }
    });

    insertMany(fullRooms);
    console.log(`>>> [SQLite] Đã nạp thành công ${fullRooms.length} phòng học vào database!`);
  }
}
