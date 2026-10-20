// server/src/data/database.js
const generateCampusRooms = () => {
  const rooms = [];
  const buildings = ['A1', 'A2'];

  for (const b of buildings) {
    for (let floor = 1; floor <= 7; floor++) {
      for (let r = 1; r <= 10; r++) {
        const roomNumStr = r.toString().padStart(2, '0');
        let id, category, capacity, name, equipment;

        // Phân bổ cân đối: Phòng 7,8 là Lab; 9,10 là Giảng đường; 1-3 phòng nhóm; 4-6 phòng học
        if (r === 7 || r === 8) {
          id = `L${b}.${floor}${roomNumStr}`;
          category = 'Phòng lab';
          capacity = 40;
          name = r === 7 ? `Phòng máy tính L${b}.${floor}${roomNumStr}` : `Lab Vi điều khiển L${b}.${floor}${roomNumStr}`;
          equipment = ['40 Máy tính cấu hình cao', 'Mạng LAN chuyên dụng'];
        } else if (r === 9 || r === 10) {
          id = `${b}.${floor}${roomNumStr}`;
          category = 'Giảng đường';
          capacity = r === 9 ? 80 : 120;
          name = `Giảng đường lớn ${id}`;
          equipment = ['Hệ thống âm thanh', 'Micro không dây', 'Máy chiếu'];
        } else if (r <= 3) {
          id = `${b}.${floor}${roomNumStr}`;
          category = 'Phòng học';
          capacity = r === 1 ? 6 : (r === 2 ? 8 : 10);
          name = `Phòng học nhóm ${id}`;
          equipment = ['Bàn tròn', 'Màn hình TV HDMI', 'Bảng trắng'];
        } else {
          id = `${b}.${floor}${roomNumStr}`;
          category = 'Phòng học';
          capacity = 30;
          name = `Phòng học lý thuyết ${id}`;
          equipment = ['Bảng từ', 'Máy chiếu', 'Điều hòa'];
        }

        rooms.push({
          id,
          building: b,
          floor,
          roomNumber: r,
          category,
          capacity,
          name,
          equipment,
          isBooked: false
        });
      }
    }
  }
  return rooms;
};

export const DB = {
  rooms: generateCampusRooms(),
  schedules: [],
  bookings: [],
  penalties: {}
};