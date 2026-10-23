// server/src/data/jsonDb.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DB_JSON_PATH = path.resolve(__dirname, 'database.json');

/**
 * Đọc dữ liệu từ file database.json
 */
export function readJsonDb() {
  try {
    if (fs.existsSync(DB_JSON_PATH)) {
      const raw = fs.readFileSync(DB_JSON_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[JSON DB] Lỗi đọc file database.json:', err.message);
  }
  return { users: [], rooms: [], bookings: [], penalties: {}, penalty_logs: [], room_locks: [] };
}

/**
 * Ghi dữ liệu vào file database.json
 */
export function writeJsonDb(data) {
  try {
    fs.writeFileSync(DB_JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[JSON DB] Lỗi ghi file database.json:', err.message);
  }
}

/**
 * Đồng bộ toàn bộ dữ liệu từ SQLite sang database.json
 */
export function syncJsonFromSqlite() {
  try {
    const users = db.prepare('SELECT id, studentId, email, fullName, password, role, createdAt FROM users').all();
    const rooms = db.prepare('SELECT id, name, building, floor, capacity, category FROM rooms ORDER BY id ASC').all();
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all();
    const penaltiesList = db.prepare('SELECT * FROM penalties').all();
    const logs = db.prepare('SELECT * FROM penalty_logs ORDER BY id DESC').all();
    const room_locks = db.prepare('SELECT * FROM room_locks ORDER BY lockedAt DESC').all();

    const penaltiesMap = {};
    penaltiesList.forEach(p => {
      penaltiesMap[p.studentId] = p;
    });

    const fullData = {
      users,
      rooms,
      bookings,
      penalties: penaltiesMap,
      penalty_logs: logs,
      room_locks
    };

    writeJsonDb(fullData);
    return fullData;
  } catch (err) {
    console.error('[JSON DB] Lỗi đồng bộ sang database.json:', err.message);
    return readJsonDb();
  }
}

/**
 * Reset toàn bộ danh sách sinh viên, chế tài, đơn đặt phòng
 * (Giữ nguyên danh sách 122 phòng học)
 */
export function resetDatabase() {
  try {
    db.prepare('DELETE FROM penalty_logs').run();
    db.prepare('DELETE FROM bookings').run();
    db.prepare('DELETE FROM penalties').run();
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM room_locks').run();

    const rooms = db.prepare('SELECT id, name, building, floor, capacity, category FROM rooms ORDER BY id ASC').all();

    const cleanData = {
      users: [],
      rooms,
      bookings: [],
      penalties: {},
      penalty_logs: [],
      room_locks: []
    };

    writeJsonDb(cleanData);
    console.log('>>> [Database] ĐÃ RESET TOÀN BỘ SINH VIÊN & LỊCH PHÒNG! File database.json đã sẵn sàng.');
    return cleanData;
  } catch (err) {
    console.error('[JSON DB] Lỗi reset database:', err.message);
    throw err;
  }
}
