import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, CheckCircle, AlertTriangle, X, ShieldAlert,
  ArrowRight, Key, DoorClosed, AlertCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'available'
  const [studentInput, setStudentInput] = useState('');
  const [memberCount, setMemberCount] = useState('');
  
  // Dữ liệu từ Server
  const [marqueeRooms, setMarqueeRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [scheduleMatrix, setScheduleMatrix] = useState([]);
  
  // Trạng thái Sinh viên sau rà soát
  const [studentStatus, setStudentStatus] = useState(null); // { hasActiveBooking, booking, penalties }
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Modal đặt phòng
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    room: null,
    isQuickBook: false,
    startTime: '08:00',
    endTime: '10:00'
  });

  const [notification, setNotification] = useState(null);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Nạp dữ liệu ban đầu
  const fetchMarqueeRooms = async () => {
    try {
      const res = await fetch(`${API_BASE}/rooms/marquee`);
      const data = await res.json();
      setMarqueeRooms(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScheduleMatrix = async () => {
    try {
      const res = await fetch(`${API_BASE}/rooms/schedule-matrix`);
      const data = await res.json();
      setScheduleMatrix(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAvailableRooms = async (count) => {
    try {
      const res = await fetch(`${API_BASE}/rooms/available?memberCount=${count || memberCount || 1}`);
      const data = await res.json();
      setAvailableRooms(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMarqueeRooms();
    fetchScheduleMatrix();
    fetchAvailableRooms(memberCount);
  }, []);

  // Xử lý khi nhấn nút ĐẶT PHÒNG / XEM THÔNG TIN ở ô nhập thông tin
  const handleStudentAction = async () => {
    if (!studentInput.trim()) {
      showToast('Vui lòng nhập MSSV hoặc Email sinh viên!', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/students/${studentInput.trim()}/check`);
      const data = await res.json();
      setStudentStatus(data);

      if (data.hasActiveBooking) {
        showToast('Đã tìm thấy thông tin đơn phòng bạn đang đặt!', 'info');
      } else {
        // Chuyển sang trang phòng trống xếp theo quy mô gần nhất
        setActiveTab('available');
        fetchAvailableRooms(memberCount);
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ!', 'error');
    }
  };

  // Mở modal Đặt ngay - Tự động tính toán giờ hợp lệ theo thời gian thực
  const handleOpenBookModal = (room, isQuick = false) => {
    const now = new Date();
    const currentHour = now.getHours();

    // 1. Sau 17:00 là đóng cổng đặt phòng trong ngày
    if (currentHour >= 17) {
      showToast('Hệ thống đã đóng cổng đặt phòng hôm nay sau 17:00!', 'error');
      return;
    }

    // 2. Tự động tính khung giờ bắt đầu hợp lệ từ thời điểm hiện tại
    const startHour = Math.max(8, currentHour);
    const endHour = Math.min(17, startHour + 2);

    const formattedStart = `${startHour.toString().padStart(2, '0')}:00`;
    const formattedEnd = `${endHour.toString().padStart(2, '0')}:00`;

    setBookingModal({
      isOpen: true,
      room,
      isQuickBook: isQuick,
      startTime: formattedStart,
      endTime: formattedEnd
    });
  };

  // Gửi yêu cầu đặt phòng
  const handleConfirmBooking = async () => {
    const sId = studentInput.trim();
    const count = parseInt(memberCount) || 1;

    if (!sId) {
      showToast('Vui lòng nhập MSSV!', 'error');
      return;
    }

    // Kiểm tra ràng buộc thời gian thực tế phía Client
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    if (currentHour >= 17) {
      showToast('Hệ thống đã đóng cổng đặt phòng sau 17:00!', 'error');
      return;
    }

    if (bookingModal.startTime < currentTimeStr) {
      showToast(`Không thể đặt giờ quá khứ! Hiện tại là ${currentTimeStr}`, 'error');
      return;
    }

    if (bookingModal.startTime >= bookingModal.endTime) {
      showToast('Giờ kết thúc phải sau giờ bắt đầu!', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: sId,
          roomId: bookingModal.room.id,
          startTime: bookingModal.startTime,
          endTime: bookingModal.endTime,
          memberCount: count
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Đặt phòng thất bại', 'error');
        return;
      }

      showToast(`Đặt thành công phòng ${bookingModal.room.id}!`, 'success');
      setBookingModal({ ...bookingModal, isOpen: false });
      
      // Đồng bộ ngay lập tức toàn bộ trạng thái hệ thống
      handleStudentAction();
      fetchMarqueeRooms();
      fetchScheduleMatrix();
      fetchAvailableRooms();
      setActiveTab('home');
    } catch (err) {
      showToast('Lỗi gửi request!', 'error');
    }
  };

  // 1. Xác nhận đã mượn phòng (Check-in)
  const handleCheckIn = async (bId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bId}/checkin`, { method: 'POST' });
      if (res.ok) {
        showToast('Xác nhận mượn phòng thành công! Trạng thái đã cập nhật.', 'success');
        handleStudentAction();
        fetchScheduleMatrix();
        fetchMarqueeRooms();
      }
    } catch (err) {
      showToast('Lỗi xác nhận!', 'error');
    }
  };

  // 2. Mô phỏng quá 10 phút không nhận phòng -> Hủy & Phạt
  const handleTimeoutNoShow = async (bId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bId}/timeout-noshow`, { method: 'POST' });
      if (res.ok) {
        showToast('Đã quá 10 phút không xác nhận: Hủy phòng & ghi nhận phạt!', 'error');
        handleStudentAction();
        fetchMarqueeRooms();
        fetchScheduleMatrix();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Xác nhận trả phòng
  const handleCheckOut = async (bId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bId}/checkout`, { method: 'POST' });
      if (res.ok) {
        showToast('Đã trả phòng thành công! Phòng đã được giải phóng.', 'success');
        handleStudentAction();
        fetchMarqueeRooms();
        fetchScheduleMatrix();
      }
    } catch (err) {
      showToast('Lỗi trả phòng!', 'error');
    }
  };

  // 4. Mô phỏng lố 30 phút không bấm trả -> Phạt & Về trống
  const handleTimeoutLateCheckOut = async (bId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bId}/timeout-latecheckout`, { method: 'POST' });
      if (res.ok) {
        showToast('Đã lố 30 phút trả phòng: Phạt vi phạm & giải phóng phòng!', 'error');
        handleStudentAction();
        fetchMarqueeRooms();
        fetchScheduleMatrix();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Toast thông báo */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl font-medium text-white transition-all ${
          notification.type === 'error' ? 'bg-red-600' : notification.type === 'info' ? 'bg-sky-600' : 'bg-emerald-600'
        }`}>
          {notification.msg}
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-sky-600 flex items-center justify-center font-bold text-sky-700 text-xs text-center p-1">
              HCMIU
            </div>
            <span className="text-xl font-bold tracking-tight text-sky-900">
              IU<span className="text-sky-600">RoomPeek</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('home')} 
              className={`text-sm font-medium transition ${activeTab === 'home' ? 'text-sky-600 border-b-2 border-sky-600 pb-1' : 'text-slate-600 hover:text-sky-600'}`}
            >
              Trang chủ
            </button>
            <button 
              onClick={() => { setActiveTab('available'); fetchAvailableRooms(); }} 
              className={`text-sm font-medium transition ${activeTab === 'available' ? 'text-sky-600 border-b-2 border-sky-600 pb-1' : 'text-slate-600 hover:text-sky-600'}`}
            >
              Phòng trống
            </button>
            <button 
              onClick={() => {
                fetchScheduleMatrix();
                setShowScheduleModal(true);
              }}
              className="flex items-center gap-2 border border-sky-600 text-sky-800 bg-sky-50/50 hover:bg-sky-100 px-3.5 py-1.5 rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Calendar className="w-4 h-4 text-sky-700" />
              Lịch phòng
            </button>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* TAB TRANG CHỦ */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            
            {/* KHUNG THÔNG TIN MƯỢN PHÒNG & LỊCH SỬ PHẠT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* CỘT TRÁI: FORM TRA CỨU */}
              <div className={`${studentStatus ? 'lg:col-span-2' : 'lg:col-span-3 max-w-xl mx-auto w-full'} bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 transition-all`}>
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Thông tin mượn phòng</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {studentStatus?.hasActiveBooking ? 'MSSV (Mã số sinh viên)' : 'Nhập email hoặc MSSV'}
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={studentInput} 
                        onChange={(e) => setStudentInput(e.target.value)}
                        placeholder="VD: 20000 hoặc ITITIU20000@student.hcmiu.edu.vn" 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                      />
                      <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {studentStatus?.hasActiveBooking ? 'Quy mô nhóm' : 'Số lượng thành viên'}
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={memberCount} 
                        onChange={(e) => setMemberCount(e.target.value)}
                        placeholder="VD: 3 hoặc 5" 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                      />
                      <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button 
                    onClick={handleStudentAction}
                    className="w-full bg-indigo-900 hover:bg-indigo-950 text-white font-medium py-3 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 mt-2"
                  >
                    {studentStatus?.hasActiveBooking ? (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Xem thông tin
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        ĐẶT PHÒNG
                      </>
                    )}
                  </button>
                </div>

                {/* THÔNG TIN PHÒNG ĐÃ ĐẶT (HIỆN RA KHI NHẤN XEM THÔNG TIN) */}
                {studentStatus?.hasActiveBooking && studentStatus.booking && (
                  <div className="mt-8 border-2 border-dashed border-sky-400 rounded-2xl p-5 bg-sky-50/40">
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 mt-0.5">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 text-lg">
                          Bạn đã đặt phòng: <span className="text-sky-700">{studentStatus.booking.roomId}</span>
                        </h3>
                        <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                          <Clock className="w-4 h-4 text-slate-400" />
                          TG: {studentStatus.booking.startTime} - {studentStatus.booking.endTime}, {studentStatus.booking.date}
                        </p>
                        <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                          <Users className="w-4 h-4 text-slate-400" />
                          Mã xác nhận: <span className="bg-slate-200 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-700">#{studentStatus.booking.id}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            {studentStatus.booking.status === 'CHECKED_IN' ? 'Đã nhận phòng' : 'Chờ xác nhận'}
                          </span>
                        </p>

                        {/* NÚT XÁC NHẬN MƯỢN & TRẢ PHÒNG */}
                        <div className="flex flex-wrap gap-3 mt-4">
                          <button 
                            onClick={() => handleCheckIn(studentStatus.booking.id)}
                            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition"
                          >
                            <Key className="w-4 h-4" />
                            Xác nhận đã mượn phòng
                          </button>
                          
                          <button 
                            onClick={() => handleCheckOut(studentStatus.booking.id)}
                            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition"
                          >
                            <DoorClosed className="w-4 h-4 text-slate-500" />
                            Xác nhận trả phòng
                          </button>
                        </div>

                        {/* CÁC NÚT MÔ PHỎNG TEST NHANH VI PHẠM */}
                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
                          <span>Mô phỏng test:</span>
                          <button 
                            onClick={() => handleTimeoutNoShow(studentStatus.booking.id)}
                            className="text-red-600 hover:underline"
                          >
                            [Test quá 10p ko nhận]
                          </button>
                          <span>•</span>
                          <button 
                            onClick={() => handleTimeoutLateCheckOut(studentStatus.booking.id)}
                            className="text-amber-600 hover:underline"
                          >
                            [Test lố 30p ko trả]
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: LỊCH SỬ BỊ PHẠT CỦA SINH VIÊN */}
              {studentStatus && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 text-red-600 font-bold mb-4">
                    <ShieldAlert className="w-5 h-5" />
                    <span>Lịch sử vi phạm & Chế tài</span>
                  </div>

                  {!studentStatus.penalties?.violations?.length ? (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-60" />
                      Sinh viên chưa có vi phạm nào.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentStatus.penalties.violations.map((v, idx) => (
                        <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                          <div className="font-semibold">{v.reason}</div>
                          <div className="text-slate-500 mt-1">{v.date}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">Quy tắc chế tài:</p>
                    <p>• Không nhận (quá 10p): Cảnh cáo → Khóa 30 ngày → Khóa vĩnh viễn.</p>
                    <p>• Trả trễ (lố 30p): Cảnh cáo → Khóa 7 ngày → Khóa 30 ngày → Ban.</p>
                  </div>
                </div>
              )}
            </div>

            {/* MỤC "⚡ CHỌN PHÒNG NHANH" (VÒNG LẶP CHẠY NGANG VÔ TẬN) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-amber-500 text-2xl">⚡</span> Chọn phòng nhanh
                </h3>
                <span className="text-xs text-slate-500 bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full border border-emerald-200">
                  Chỉ hiển thị {marqueeRooms.length} phòng đang TRỐNG
                </span>
              </div>

              {/* Băng chuyền chuyển động liên tục từ phải sang trái */}
              <div className="overflow-hidden relative w-full rounded-2xl py-2">
                <div className="flex gap-4 animate-marquee pause-hover w-max">
                  {[...marqueeRooms, ...marqueeRooms].map((room, idx) => (
                    <div 
                      key={`${room.id}-${idx}`} 
                      className="w-64 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-shrink-0 flex flex-col justify-between"
                    >
                      <div className="bg-indigo-900 text-white p-4 text-center relative">
                        <span className="absolute top-2 right-2 bg-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded text-white tracking-wider">
                          TRỐNG
                        </span>
                        <div className="text-3xl font-extrabold tracking-wide mt-1">{room.id}</div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="inline-block bg-sky-50 text-sky-700 text-[11px] font-semibold px-2 py-0.5 rounded-md mb-1.5">
                            {room.category}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{room.name}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Sức chứa: {room.capacity} chỗ
                          </p>
                        </div>

                        <button 
                          onClick={() => handleOpenBookModal(room, true)}
                          className="w-full border border-slate-300 hover:border-indigo-800 hover:text-indigo-900 text-slate-700 text-xs font-semibold py-2 rounded-xl transition text-center"
                        >
                          Đặt ngay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB TRANG PHÒNG TRỐNG (XẾP THEO GẦN SỐ NGƯỜI NHẤT) */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Danh sách phòng khả dụng</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Đang ưu tiên xếp các phòng có sức chứa gần nhất với quy mô: <strong className="text-sky-700">{memberCount || 1} người</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={memberCount} 
                  onChange={(e) => {
                    setMemberCount(e.target.value);
                    fetchAvailableRooms(e.target.value);
                  }}
                  placeholder="Đổi số lượng người"
                  className="w-40 px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* LƯỚI CARD PHÒNG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {availableRooms.map((room) => (
                <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
                  <div className="bg-indigo-900 text-white p-4 text-center relative">
                    <span className="absolute top-2 right-2 bg-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded text-white tracking-wider">
                      TRỐNG
                    </span>
                    <div className="text-3xl font-extrabold tracking-wide mt-1">{room.id}</div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="inline-block bg-sky-50 text-sky-700 text-[11px] font-semibold px-2 py-0.5 rounded-md mb-1.5">
                        {room.category}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm">{room.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Sức chứa: {room.capacity} chỗ
                      </p>
                    </div>

                    <button 
                      onClick={() => handleOpenBookModal(room, false)}
                      className="w-full border border-slate-300 hover:border-indigo-800 hover:text-indigo-900 text-slate-700 text-xs font-semibold py-2 rounded-xl transition text-center"
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL LỊCH PHÒNG TỔNG QUÁT (HÔM NAY) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-sky-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-700" />
                Lịch phòng tổng quát (Hôm nay)
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BẢNG CUỘN HIỂN THỊ ĐẦY ĐỦ 140 PHÒNG */}
            <div className="mt-4 overflow-x-auto max-h-[65vh] overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-center border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-600">
                    <th className="py-3 px-4 text-left bg-white">PHÒNG</th>
                    <th className="py-3 px-4 bg-white">08:00 - 10:00</th>
                    <th className="py-3 px-4 bg-white">10:00 - 12:00</th>
                    <th className="py-3 px-4 bg-white">13:00 - 15:00</th>
                    <th className="py-3 px-4 bg-white">15:00 - 17:00</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {scheduleMatrix.map((row) => (
                    <tr key={row.roomId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-left font-bold text-slate-800">{row.roomId}</td>
                      {['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '15:00 - 17:00'].map(slot => {
                        const status = row.slots[slot];
                        return (
                          <td key={slot} className="py-2.5 px-3">
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${
                              status === 'Trống' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {status}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Có thể đặt
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Đã có người đặt
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN ĐẶT PHÒNG */}
      {bookingModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Xác nhận đặt phòng</h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-2">
              <div className="text-lg font-bold text-slate-800">
                Phòng: <span className="text-sky-700">{bookingModal.room?.id}</span>
              </div>
              <div className="text-xs text-slate-500">
                {bookingModal.room?.category} • Sức chứa: {bookingModal.room?.capacity} người
              </div>
            </div>

            {bookingModal.isQuickBook && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã số sinh viên (MSSV)</label>
                  <input 
                    type="text" 
                    value={studentInput} 
                    onChange={(e) => setStudentInput(e.target.value)}
                    placeholder="VD: 20000"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng người tham gia</label>
                  <input 
                    type="number" 
                    value={memberCount} 
                    onChange={(e) => setMemberCount(e.target.value)}
                    placeholder="VD: 4"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ bắt đầu</label>
                <input 
                  type="time" 
                  value={bookingModal.startTime}
                  onChange={(e) => setBookingModal({ ...bookingModal, startTime: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ kết thúc</label>
                <input 
                  type="time" 
                  value={bookingModal.endTime}
                  onChange={(e) => setBookingModal({ ...bookingModal, endTime: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setBookingModal({ ...bookingModal, isOpen: false })}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmBooking}
                className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-sm font-semibold shadow-md transition"
              >
                Đồng ý đặt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}