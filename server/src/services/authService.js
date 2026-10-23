// server/src/services/authService.js
import { db } from '../data/sqlite.js';
import { syncJsonFromSqlite } from '../data/jsonDb.js';

export const AuthService = {
  // 1. Kiểm tra định dạng email sinh viên IU (@student.hcmiu.edu.vn)
  validateStudentEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    const iuEmailRegex = /^[a-zA-Z0-9._%+-]+@student\.hcmiu\.edu\.vn$/i;
    return iuEmailRegex.test(clean);
  },

  // 2. Trích xuất MSSV gợi ý từ email
  extractStudentIdFromEmail(email) {
    if (!email) return '';
    const prefix = email.split('@')[0].trim().toUpperCase();
    return prefix;
  },

  // 3. Đăng ký tài khoản mới bằng Email sinh viên IU (mặc định role = 'student')
  register({ fullName, studentId, email, password, role = 'student' }) {
    if (!fullName || fullName.trim().length < 2) {
      throw new Error('Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự)!');
    }

    if (!email || !this.validateStudentEmail(email)) {
      throw new Error('Email không hợp lệ! Bắt buộc phải sử dụng email sinh viên trường ĐH Quốc Tế (@student.hcmiu.edu.vn).');
    }

    if (!studentId || studentId.trim().length < 3) {
      throw new Error('Vui lòng nhập Mã số sinh viên (MSSV) hợp lệ!');
    }

    if (!password || password.length < 6) {
      throw new Error('Mật khẩu phải có độ dài tối thiểu 6 ký tự!');
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanStudentId = studentId.trim().toUpperCase();
    const cleanRole = role === 'admin' ? 'admin' : 'student';

    // Kiểm tra trùng Email hoặc MSSV
    const existing = db.prepare('SELECT * FROM users WHERE UPPER(studentId) = ? OR LOWER(email) = ?').get(cleanStudentId, cleanEmail);
    if (existing) {
      if (existing.email.toLowerCase() === cleanEmail) {
        throw new Error('Email sinh viên này đã được đăng ký tài khoản!');
      }
      throw new Error('Mã số sinh viên (MSSV) này đã được đăng ký tài khoản!');
    }

    const id = `USR_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, studentId, email, fullName, password, role, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, cleanStudentId, cleanEmail, cleanName, password, cleanRole, createdAt);

    // Khởi tạo sẵn bản ghi penalties để đảm bảo foreign key & tính toàn vẹn
    const existingPenalty = db.prepare('SELECT * FROM penalties WHERE UPPER(studentId) = ?').get(cleanStudentId);
    if (!existingPenalty) {
      db.prepare(`
        INSERT INTO penalties (studentId, noShowCount, lateCheckoutCount, banUntil, isBannedPermanent)
        VALUES (?, 0, 0, NULL, 0)
      `).run(cleanStudentId);
    }

    // Đồng bộ sang database.json ngay lập tức
    syncJsonFromSqlite();

    return {
      success: true,
      user: {
        id,
        studentId: cleanStudentId,
        email: cleanEmail,
        fullName: cleanName,
        role: cleanRole
      },
      message: 'Đăng ký tài khoản thành công!'
    };
  },

  // 4. Đăng nhập tài khoản bằng Email sinh viên hoặc MSSV
  login({ emailOrStudentId, password }) {
    if (!emailOrStudentId || !password) {
      throw new Error('Vui lòng nhập Email/MSSV và Mật khẩu!');
    }

    const cleanInput = emailOrStudentId.trim();
    const candidateEmail = cleanInput.includes('@')
      ? cleanInput.toLowerCase()
      : `${cleanInput.toLowerCase()}@student.hcmiu.edu.vn`;

    const user = db.prepare(`
      SELECT * FROM users 
      WHERE UPPER(studentId) = ? 
         OR LOWER(email) = ? 
         OR LOWER(email) = ?
    `).get(cleanInput.toUpperCase(), cleanInput.toLowerCase(), candidateEmail);

    if (!user) {
      throw new Error('Tài khoản không tồn tại! Vui lòng kiểm tra lại Email hoặc MSSV.');
    }

    if (user.password !== password) {
      throw new Error('Mật khẩu không chính xác!');
    }

    return {
      success: true,
      user: {
        id: user.id,
        studentId: user.studentId,
        email: user.email,
        fullName: user.fullName,
        role: user.role || 'student'
      },
      message: 'Đăng nhập thành công!'
    };
  },

  // 5. Lấy danh sách tất cả người dùng
  getAllUsers() {
    return db.prepare('SELECT id, studentId, email, fullName, role, createdAt FROM users').all();
  },

  // 6. Lấy danh sách người dùng đầy đủ kèm thông tin chế tài (cho Admin Devpage)
  getAllUsersWithStatus() {
    const users = db.prepare('SELECT id, studentId, email, fullName, role, createdAt FROM users ORDER BY createdAt DESC').all();
    const penalties = db.prepare('SELECT * FROM penalties').all();
    const penMap = {};
    penalties.forEach(p => {
      penMap[p.studentId.toUpperCase()] = p;
    });

    const now = new Date();

    return users.map(u => {
      const p = penMap[u.studentId.toUpperCase()];
      const isBanned = p && (p.isBannedPermanent === 1 || (p.banUntil && new Date(p.banUntil) > now));
      let banStatusText = 'Bình thường';
      if (p?.isBannedPermanent) {
        banStatusText = 'Cấm vĩnh viễn';
      } else if (p?.banUntil && new Date(p.banUntil) > now) {
        const diffMs = new Date(p.banUntil) - now;
        const diffMins = Math.ceil(diffMs / (60 * 1000));
        if (diffMins <= 15) {
          banStatusText = `Tạm cấm ${diffMins}p (hủy > 3 lần)`;
        } else {
          banStatusText = `Khóa đến ${new Date(p.banUntil).toLocaleDateString('vi-VN')}`;
        }
      }

      return {
        ...u,
        role: u.role || 'student',
        penalties: p || { noShowCount: 0, lateCheckoutCount: 0, banUntil: null, isBannedPermanent: 0 },
        isBanned: !!isBanned,
        banStatusText
      };
    });
  },

  // 7. Cập nhật quyền hạn người dùng (student <-> admin)
  updateUserRole(userId, newRole) {
    if (!['student', 'admin'].includes(newRole)) {
      throw new Error('Quyền hạn không hợp lệ! Chỉ chấp nhận student hoặc admin.');
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) throw new Error('Không tìm thấy tài khoản người dùng!');

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, userId);
    syncJsonFromSqlite();
    return {
      success: true,
      message: `Đã đổi quyền người dùng ${user.fullName} (${user.studentId}) thành ${newRole.toUpperCase()}!`
    };
  }
};
