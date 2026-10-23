// client/src/services/api.js
const API_BASE = 'http://localhost:5000/api';

let currentSimulatedTime = null;

export const setSimulatedTime = (time) => {
  currentSimulatedTime = time;
};

export const getSimulatedTime = () => currentSimulatedTime;

const getHeaders = (extra = {}) => {
  const h = { 'Content-Type': 'application/json', ...extra };
  if (currentSimulatedTime) {
    h['x-simulated-time'] = currentSimulatedTime;
  }
  return h;
};

export const api = {
  setDevTime: (time) => {
    currentSimulatedTime = time;
  },

  // Đăng ký tài khoản sinh viên IU
  register: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng ký tài khoản thất bại');
    return data;
  },

  // Đăng nhập tài khoản bằng Email IU hoặc MSSV
  login: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
    return data;
  },

  // Lấy danh sách phòng marquee chạy ngang
  getMarqueeRooms: async () => {
    const res = await fetch(`${API_BASE}/rooms/marquee`);
    return res.json();
  },

  // Lấy ma trận lịch 140 phòng (hỗ trợ truyền ngày dạng YYYY-MM-DD)
  getScheduleMatrix: async (date = '') => {
    const url = date ? `${API_BASE}/rooms/schedule-matrix?date=${date}` : `${API_BASE}/rooms/schedule-matrix`;
    const res = await fetch(url);
    return res.json();
  },

  // Lấy phòng khả dụng theo số người
  getAvailableRooms: async (memberCount) => {
    const res = await fetch(`${API_BASE}/rooms/available?memberCount=${memberCount || 1}`);
    return res.json();
  },

  // Kiểm tra sinh viên & trạng thái đặt phòng
  checkStudent: async (studentId) => {
    const res = await fetch(`${API_BASE}/students/${studentId.trim()}/check`);
    return res.json();
  },

  // Tạo đơn đặt phòng
  createBooking: async (payload) => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...payload, simulatedTime: currentSimulatedTime || undefined })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đặt phòng thất bại');
    return data;
  },

  // Hủy đặt phòng (tối đa 3 lần/ngày)
  cancelBooking: async (bookingId, studentId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ studentId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Hủy đặt phòng thất bại');
    return data;
  },

  // Mốc 1: Điểm danh nhận phòng
  checkIn: async (bookingId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/checkin`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Check-in thất bại');
    return data;
  },

  // Mốc 2: Điểm danh trả phòng
  checkOut: async (bookingId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/checkout`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Check-out thất bại');
    return data;
  },

  // Test vi phạm
  timeoutNoShow: async (bookingId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/timeout-noshow`, { method: 'POST' });
    return res.json();
  },

  timeoutLateCheckout: async (bookingId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/timeout-latecheckout`, { method: 'POST' });
    return res.json();
  },

  // ==================== ADMIN DEVPAGE ====================
  // Lấy danh sách users kèm role và tình trạng chế tài
  getAdminUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách tài khoản');
    return data;
  },

  // Cập nhật quyền hạn (student <-> admin)
  updateUserRole: async (userId, role) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể cập nhật quyền');
    return data;
  },

  // Gỡ ban cho sinh viên
  unbanStudent: async (studentId) => {
    const res = await fetch(`${API_BASE}/admin/students/${studentId}/unban`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể gỡ ban');
    return data;
  },

  // Ma trận phòng chi tiết kèm thông tin sinh viên đã đặt
  getAdminScheduleMatrix: async (date) => {
    const url = date ? `${API_BASE}/admin/schedule-matrix?date=${date}` : `${API_BASE}/admin/schedule-matrix`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể tải ma trận phòng admin');
    return data;
  },

  // Danh sách các phòng đang bị khóa
  getAdminLocks: async () => {
    const res = await fetch(`${API_BASE}/admin/locks`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách khóa phòng');
    return data;
  },

  // Tạo lệnh khóa phòng
  createRoomLock: async (payload) => {
    const res = await fetch(`${API_BASE}/admin/locks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể khóa phòng');
    return data;
  },

  // Mở khóa phòng
  deleteRoomLock: async (lockId) => {
    const res = await fetch(`${API_BASE}/admin/locks/${lockId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể mở khóa phòng');
    return data;
  }
};