const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Mock Data từ Mockjson/db.json
const MOCK_STUDENTS = [
  { id: "ITITIU20000", name: "Nguyễn Văn An", email: "ITITIU20000@student.hcmiu.edu.vn", status: "active" },
  { id: "BAIU20001", name: "Trần Thị Bích", email: "BAIU20001@student.hcmiu.edu.vn", status: "active" },
  { id: "EEIU20002", name: "Lê Hoàng Cường", email: "EEIU20002@student.hcmiu.edu.vn", status: "banned" },
  { id: "BTIU20003", name: "Phạm Minh Đức", email: "BTIU20003@student.hcmiu.edu.vn", status: "active" },
  { id: "ENIU20004", name: "Võ Quỳnh Hoa", email: "ENIU20004@student.hcmiu.edu.vn", status: "banned" },
];

const MOCK_ROOMS = [
  { id: "A1.101", name: "Phòng học nhóm A1.101", type: "CLASSROOM", typeName: "Phòng học", subType: "Phòng học nhóm", capacityMin: 1, capacityMax: 35, capacityDisplay: "4-8", isAvailableNow: true, building: "A1", floor: 1 },
  { id: "A1.102", name: "Phòng học nhóm A1.102", type: "CLASSROOM", typeName: "Phòng học", subType: "Phòng học nhóm", capacityMin: 1, capacityMax: 35, capacityDisplay: "6-10", isAvailableNow: true, building: "A1", floor: 1 },
  { id: "A1.103", name: "Phòng học nhóm A1.103", type: "CLASSROOM", typeName: "Phòng học", subType: "Phòng học nhóm", capacityMin: 1, capacityMax: 35, capacityDisplay: "4-8", isAvailableNow: false, building: "A1", floor: 1 },
  { id: "A2.205", name: "Giảng đường lớn A2.205", type: "AUDITORIUM", typeName: "Giảng đường", subType: "Giảng đường lớn", capacityMin: 36, capacityMax: 150, capacityDisplay: "50-100", isAvailableNow: true, building: "A2", floor: 2 },
  { id: "A2.104", name: "Giảng đường vừa A2.104", type: "AUDITORIUM", typeName: "Giảng đường", subType: "Giảng đường vừa", capacityMin: 36, capacityMax: 150, capacityDisplay: "30-60", isAvailableNow: true, building: "A2", floor: 1 },
  { id: "LA1.301", name: "Phòng máy tính LA1.301", type: "LAB", typeName: "Phòng lab", subType: "Phòng máy tính", capacityMin: 20, capacityMax: 40, capacityDisplay: "40", isAvailableNow: true, building: "LA1", floor: 3 },
  { id: "LA1.305", name: "Lab Quang tử y sinh", type: "LAB", typeName: "Phòng lab", subType: "Quang tử y sinh", capacityMin: 6, capacityMax: 10, capacityDisplay: "6-10", isAvailableNow: true, building: "LA1", floor: 3 },
  { id: "LA1.202", name: "Lab Viễn thông LA1.202", type: "LAB", typeName: "Phòng lab", subType: "Viễn thông & IoT", capacityMin: 15, capacityMax: 30, capacityDisplay: "30", isAvailableNow: true, building: "LA1", floor: 2 },
  { id: "Lib.01", name: "Phòng tự học Thư viện Lib.01", type: "CLASSROOM", typeName: "Phòng học", subType: "Không gian tự học", capacityMin: 1, capacityMax: 35, capacityDisplay: "4-8", isAvailableNow: true, building: "Library", floor: 1 },
];

const INITIAL_BOOKINGS = [
  {
    id: "book-20261019-001",
    bookingCode: "#BK8X92",
    roomId: "A1.101",
    roomName: "Phòng học nhóm A1.101",
    roomType: "CLASSROOM",
    studentId: "ITITIU20000",
    studentName: "Nguyễn Văn An",
    studentEmail: "ITITIU20000@student.hcmiu.edu.vn",
    groupSize: 5,
    bookingDate: "2026-10-19",
    startTime: "08:00",
    endTime: "10:00",
    timeDisplay: "08:00 - 10:00, 19/10/2026",
    status: "CONFIRMED",
    attendance: {
      checkIn: { status: "PENDING", checkedAt: null, canCheckIn: true, label: "Xác nhận đã mượn phòng" },
      checkOut: { status: "PENDING", checkedAt: null, canCheckOut: false, label: "Xác nhận trả phòng" }
    },
    cancellation: null
  },
  {
    id: "book-20261019-002",
    bookingCode: "#BK2A44",
    roomId: "A1.102",
    roomName: "Phòng học nhóm A1.102",
    roomType: "CLASSROOM",
    studentId: "BAIU20001",
    studentName: "Trần Thị Bích",
    studentEmail: "BAIU20001@student.hcmiu.edu.vn",
    groupSize: 6,
    bookingDate: "2026-10-19",
    startTime: "10:30",
    endTime: "13:30",
    timeDisplay: "10:30 - 13:30, 19/10/2026",
    status: "CONFIRMED",
    attendance: {
      checkIn: { status: "PENDING", checkedAt: null, canCheckIn: true },
      checkOut: { status: "PENDING", checkedAt: null, canCheckOut: false }
    },
    cancellation: null
  },
  {
    id: "book-20261019-003",
    bookingCode: "#BK7M89",
    roomId: "A2.205",
    roomName: "Giảng đường lớn A2.205",
    roomType: "AUDITORIUM",
    studentId: "ITITIU19999",
    studentName: "Lê Minh Tuấn",
    studentEmail: "ITITIU19999@student.hcmiu.edu.vn",
    groupSize: 60,
    bookingDate: "2026-10-19",
    startTime: "08:00",
    endTime: "10:00",
    timeDisplay: "08:00 - 10:00, 19/10/2026",
    status: "CONFIRMED",
    attendance: {
      checkIn: { status: "CHECKED_IN", checkedAt: "2026-10-19T08:05:00Z" },
      checkOut: { status: "PENDING", checkedAt: null }
    },
    cancellation: null
  },
  {
    id: "book-20261019-004",
    bookingCode: "#BK9Y11",
    roomId: "A1.101",
    roomName: "Phòng học nhóm A1.101",
    roomType: "CLASSROOM",
    studentId: "BTIU20003",
    studentName: "Phạm Minh Đức",
    studentEmail: "BTIU20003@student.hcmiu.edu.vn",
    groupSize: 4,
    bookingDate: "2026-10-19",
    startTime: "15:00",
    endTime: "17:00",
    timeDisplay: "15:00 - 17:00, 19/10/2026",
    status: "CONFIRMED",
    attendance: {
      checkIn: { status: "PENDING", checkedAt: null, canCheckIn: true },
      checkOut: { status: "PENDING", checkedAt: null, canCheckOut: false }
    },
    cancellation: null
  },
  {
    id: "book-20261019-005",
    bookingCode: "#BK3C12",
    roomId: "LA1.301",
    roomName: "Phòng máy tính LA1.301",
    roomType: "LAB",
    studentId: "ITITIU19997",
    studentName: "Trương Quốc Khánh",
    studentEmail: "ITITIU19997@student.hcmiu.edu.vn",
    groupSize: 35,
    bookingDate: "2026-10-19",
    startTime: "10:00",
    endTime: "17:00",
    timeDisplay: "10:00 - 17:00, 19/10/2026",
    status: "CONFIRMED",
    attendance: {
      checkIn: { status: "CHECKED_IN", checkedAt: "2026-10-19T10:02:00Z" },
      checkOut: { status: "PENDING", checkedAt: null }
    },
    cancellation: null
  }
];

function getStoredBookings() {
  try {
    const raw = localStorage.getItem('iurp_gdg_bookings');
    if (!raw) {
      localStorage.setItem('iurp_gdg_bookings', JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKINGS;
  }
}

function saveStoredBookings(bookings) {
  try {
    localStorage.setItem('iurp_gdg_bookings', JSON.stringify(bookings));
  } catch (err) {
    console.error('Lỗi lưu bookings', err);
  }
}

// Helper: Chuyển 'HH:mm' sang phút
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Helper: Thuật toán kiểm tra đè thời gian (isTimeOverlapping)
export function isTimeOverlapping(startA, endA, startB, endB) {
  const minStartA = timeToMinutes(startA);
  const minEndA = timeToMinutes(endA);
  const minStartB = timeToMinutes(startB);
  const minEndB = timeToMinutes(endB);
  // startA < endB && endA > startB
  return minStartA < minEndB && minEndA > minStartB;
}

// Fetch bọc lỗi: thử gọi API thật trước, nếu server chưa chạy thì fallback sang Mock data
async function apiFetch(path, options = {}) {
  try {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    // Fallback sang local logic
    return null;
  }
}

// 1. Rooms
export async function getRooms() {
  const serverRes = await apiFetch('/rooms');
  if (serverRes && Array.isArray(serverRes)) return serverRes;
  return MOCK_ROOMS;
}

// 2. Quick available rooms (có hỗ trợ quy mô)
export async function getQuickAvailableRooms(filterScaleOrSize) {
  const allRooms = await getRooms();
  if (!filterScaleOrSize || filterScaleOrSize === 'ALL') {
    return allRooms.slice(0, 5);
  }
  if (filterScaleOrSize === 'CLASSROOM') {
    return allRooms.filter(r => r.type === 'CLASSROOM');
  }
  if (filterScaleOrSize === 'AUDITORIUM') {
    return allRooms.filter(r => r.type === 'AUDITORIUM');
  }
  const size = Number(filterScaleOrSize);
  if (size <= 35) {
    return allRooms.filter(r => r.type === 'CLASSROOM');
  } else {
    return allRooms.filter(r => r.type === 'AUDITORIUM');
  }
}

// 3. Students
export async function getStudent(studentIdOrEmail) {
  const clean = studentIdOrEmail.trim().toLowerCase();
  const id = clean.split('@')[0];

  const serverRes = await apiFetch(`/students/${id}`);
  if (serverRes && serverRes.id) return serverRes;

  const found = MOCK_STUDENTS.find(s => s.id.toLowerCase() === id || s.email.toLowerCase() === clean);
  if (found) return found;

  // Nếu không thấy trong mock thì tạo 1 sinh viên hợp lệ tự động
  return {
    id: id.toUpperCase(),
    name: `Sinh viên ${id.toUpperCase()}`,
    email: clean.includes('@') ? clean : `${id}@student.hcmiu.edu.vn`,
    status: 'active'
  };
}

// 4. Bookings
export async function getActiveBooking(studentIdOrEmail) {
  if (!studentIdOrEmail) return null;
  const clean = studentIdOrEmail.trim().toLowerCase();
  const id = clean.split('@')[0];

  const serverRes = await apiFetch(`/bookings/active?studentId=${id}`);
  if (serverRes) return serverRes;

  const bookings = getStoredBookings();
  const active = bookings.find(
    b => b.studentId.toLowerCase() === id &&
         b.status === 'CONFIRMED' &&
         b.attendance?.checkOut?.status !== 'CHECKED_OUT'
  );
  return active || null;
}

// 5. Khung giờ đã bị đặt của 1 phòng
export async function getBookedRanges(roomId, date = '2026-10-19') {
  const bookings = getStoredBookings();
  return bookings
    .filter(b => b.roomId === roomId && b.bookingDate === date && b.status === 'CONFIRMED')
    .map(b => ({
      startTime: b.startTime,
      endTime: b.endTime,
      bookingCode: b.bookingCode,
      label: `Đã có người đặt (${b.startTime} - ${b.endTime})`
    }));
}

// 6. Tạo đơn mượn phòng (Chống đè giờ 409 & Thiếu thông tin 400)
export async function createBooking(payload) {
  const { roomId, studentId, studentEmail, groupSize, bookingDate, startTime, endTime } = payload;

  if (!startTime || !endTime) {
    throw new Error('Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc!');
  }
  if (startTime >= endTime) {
    throw new Error('Giờ kết thúc (trả phòng) phải sau giờ bắt đầu (điểm danh)!');
  }

  // Check collision (409 Conflict)
  const existing = await getBookedRanges(roomId, bookingDate);
  const conflict = existing.find(b => isTimeOverlapping(startTime, endTime, b.startTime, b.endTime));
  if (conflict) {
    throw new Error(`Khung giờ bạn chọn bị trùng với lịch đã đặt trước của phòng này (${conflict.bookingCode}: ${conflict.startTime} - ${conflict.endTime})!`);
  }

  const cleanId = (studentId || studentEmail.split('@')[0]).toUpperCase();
  const randomCode = '#BK' + Math.random().toString(36).substring(2, 6).toUpperCase();

  const newBooking = {
    id: `book-${Date.now()}`,
    bookingCode: randomCode,
    roomId,
    roomName: payload.roomName || roomId,
    roomType: payload.roomType || 'CLASSROOM',
    studentId: cleanId,
    studentName: payload.studentName || cleanId,
    studentEmail: payload.studentEmail || `${cleanId}@student.hcmiu.edu.vn`,
    groupSize: Number(groupSize) || 5,
    bookingDate: bookingDate || '2026-10-19',
    startTime,
    endTime,
    timeDisplay: `${startTime} - ${endTime}, 19/10/2026`,
    status: 'CONFIRMED',
    attendance: {
      checkIn: { status: 'PENDING', checkedAt: null, canCheckIn: true, label: 'Xác nhận đã mượn phòng' },
      checkOut: { status: 'PENDING', checkedAt: null, canCheckOut: false, label: 'Xác nhận trả phòng' }
    },
    cancellation: null
  };

  const bookings = getStoredBookings();
  bookings.unshift(newBooking);
  saveStoredBookings(bookings);

  return newBooking;
}

// 7. Check-in (Mốc 1)
export async function checkIn(bookingId) {
  const bookings = getStoredBookings();
  const b = bookings.find(item => item.id === bookingId);
  if (b) {
    b.attendance.checkIn = {
      status: 'CHECKED_IN',
      checkedAt: new Date().toISOString(),
      canCheckIn: false,
      label: 'Đã nhận phòng'
    };
    b.attendance.checkOut.canCheckOut = true;
    saveStoredBookings(bookings);
  }
  return { success: true };
}

// 8. Check-out (Mốc 2)
export async function checkOut(bookingId) {
  const bookings = getStoredBookings();
  const b = bookings.find(item => item.id === bookingId);
  if (b) {
    b.attendance.checkOut = {
      status: 'CHECKED_OUT',
      checkedAt: new Date().toISOString(),
      canCheckOut: false,
      label: 'Đã hoàn tất trả phòng'
    };
    b.status = 'COMPLETED';
    saveStoredBookings(bookings);
  }
  return { success: true };
}

// 9. Hủy phòng
export async function cancelBooking(bookingId) {
  const bookings = getStoredBookings();
  const b = bookings.find(item => item.id === bookingId);
  if (b) {
    b.status = 'CANCELLED';
    saveStoredBookings(bookings);
  }
  return { success: true };
}

// 10. Lấy danh sách toàn bộ bookings (để vẽ Google Calendar)
export function getAllBookings() {
  return getStoredBookings();
}

// 11. Schedule Matrix (kèm customBookings cho lịch chen ngang)
export async function getScheduleMatrix(date = '2026-10-19') {
  const bookings = getStoredBookings().filter(b => b.status === 'CONFIRMED');

  const baseRooms = [
    {
      roomId: "A1.101",
      roomName: "A1.101",
      roomType: "CLASSROOM",
      slots: [
        { slotTime: "08:00 - 10:00", isBooked: true, statusLabel: "Đã đặt", bookingCode: "#BK8X92" },
        { slotTime: "10:00 - 12:00", isBooked: false, statusLabel: "Trống", bookingCode: null },
        { slotTime: "13:00 - 15:00", isBooked: false, statusLabel: "Trống", bookingCode: null },
        { slotTime: "15:00 - 17:00", isBooked: true, statusLabel: "Đã đặt", bookingCode: "#BK9Y11" },
      ]
    },
    {
      roomId: "A1.102",
      roomName: "A1.102",
      roomType: "CLASSROOM",
      slots: [
        { slotTime: "08:00 - 10:00", isBooked: false, statusLabel: "Trống", bookingCode: null },
        { slotTime: "10:00 - 12:00", isBooked: false, statusLabel: "Trống", bookingCode: null },
        { slotTime: "13:00 - 15:00", isBooked: false, statusLabel: "Trống", bookingCode: null },
        { slotTime: "15:00 - 17:00", isBooked: false, statusLabel: "Trống", bookingCode: null },
      ],
      customBookings: [
        { startTime: "10:30", endTime: "13:30", label: "VD: 10h30 - 13h30", bookingCode: "#BK2A44" }
      ]
    },
    {
      roomId: "A2.205",
      roomName: "A2.205",
      roomType: "AUDITORIUM",
      slots: [
        { slotTime: "08:00 - 10:00", isBooked: true, statusLabel: "Đã đặt", bookingCode: "#BK7M89" },
        { slotTime: "10:00 - 12:00", isBooked: true, statusLabel: "Đã đặt", bookingCode: "#BK7M90" },
        { slotTime: "13:00 - 15:00", isBooked: false, statusLabel: "Trống", bookingCode: null },
        { slotTime: "15:00 - 17:00", isBooked: false, statusLabel: "Trống", bookingCode: null },
      ]
    },
    {
      roomId: "LA1.301",
      roomName: "LA1.301",
      roomType: "LAB",
      slots: [
        { slotTime: "08:00 - 10:00", isBooked: false, statusLabel: "Trống", bookingCode: null },
        { slotTime: "10:00 - 12:00", isBooked: true, statusLabel: "Đã đặt", bookingCode: "#BK3C12" },
        { slotTime: "13:00 - 15:00", isBooked: true, statusLabel: "Đã đặt", bookingCode: "#BK3C13" },
        { slotTime: "15:00 - 17:00", isBooked: true, statusLabel: "Đã đặt", bookingCode: "#BK3C14" },
      ]
    }
  ];

  return { rooms: baseRooms, date, bookings };
}

export const TIME_SLOTS = [
  { id: 'slot1', label: '08:00 – 10:00', startTime: '08:00', endTime: '10:00' },
  { id: 'slot2', label: '10:00 – 12:00', startTime: '10:00', endTime: '12:00' },
  { id: 'slot3', label: '13:00 – 15:00', startTime: '13:00', endTime: '15:00' },
  { id: 'slot4', label: '15:00 – 17:00', startTime: '15:00', endTime: '17:00' },
];
