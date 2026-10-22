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
  `);

  // 2. Kiểm tra số lượng phòng hiện tại
  const countRow = db.prepare('SELECT COUNT(*) as count FROM rooms').get();

  // Nếu số phòng < 50 (đang chỉ có 4 phòng mẫu), ta sẽ nạp danh sách 140 phòng chuẩn
  if (countRow.count < 50) {
    db.prepare('DELETE FROM rooms').run(); // Xóa 4 phòng mẫu cũ

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

          // Phân loại phòng và sức chứa đa dạng
          let category = 'Phòng học nhóm';
          let capacity = 6;

          if (r === 1) {
            category = 'Giảng đường lớn';
            capacity = 120;
          } else if (r === 2) {
            category = 'Phòng thảo luận';
            capacity = 12;
          } else if (r === 3) {
            category = 'Phòng tự học';
            capacity = 8;
          } else {
            category = 'Phòng thực hành / Nhóm';
            capacity = 6;
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

    // Thực thi nạp toàn bộ vào database bằng 1 Transaction nhanh
    const insertMany = db.transaction((rooms) => {
      for (const room of rooms) {
        insertRoom.run(room);
      }
    });

    insertMany(fullRooms);
    console.log(`>>> [SQLite] Đã nạp thành công ${fullRooms.length} phòng học vào database!`);
  }
}