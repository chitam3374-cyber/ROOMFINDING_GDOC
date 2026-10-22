import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import ScheduleModal from './components/ScheduleModal';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [studentInput, setStudentInput] = useState('');
  const [memberCount, setMemberCount] = useState('');
  
  const [marqueeRooms, setMarqueeRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [scheduleMatrix, setScheduleMatrix] = useState([]);
  const [studentStatus, setStudentStatus] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Lấy ngày hôm nay YYYY-MM-DD theo giờ địa phương
  const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    room: null,
    isQuickBook: false,
    date: getTodayStr(),
    startTime: '08:00',
    endTime: '10:00'
  });

  const [notification, setNotification] = useState(null);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      const [marquee, matrix, available] = await Promise.all([
        api.getMarqueeRooms(),
        api.getScheduleMatrix(getTodayStr()),
        api.getAvailableRooms(memberCount)
      ]);
      setMarqueeRooms(marquee);
      setScheduleMatrix(matrix);
      setAvailableRooms(available);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStudentAction = async () => {
    if (!studentInput.trim()) {
      showToast('Vui lòng nhập MSSV hoặc Email sinh viên!', 'error');
      return;
    }

    try {
      const data = await api.checkStudent(studentInput);
      setStudentStatus(data);

      if (data.hasActiveBooking) {
        showToast('Đã tìm thấy thông tin đơn phòng bạn đang đặt!', 'info');
      } else {
        setActiveTab('available');
        const rooms = await api.getAvailableRooms(memberCount);
        setAvailableRooms(rooms);
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ!', 'error');
    }
  };

  // Mở Modal đặt phòng và tự tính khung giờ hợp lệ
  const handleOpenBookModal = (room, isQuick = false) => {
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = getTodayStr();

    // Giờ bắt đầu trong khoảng 8h - 16h
    let startHour = Math.max(8, Math.min(16, currentHour));
    let endHour = Math.min(17, startHour + 2);

    const formattedStart = `${startHour.toString().padStart(2, '0')}:00`;
    const formattedEnd = `${endHour.toString().padStart(2, '0')}:00`;

    setBookingModal({
      isOpen: true,
      room,
      isQuickBook: isQuick,
      date: todayStr,
      startTime: formattedStart,
      endTime: formattedEnd
    });
  };

  // Xác nhận đặt phòng với các ràng buộc 08:00 - 17:00, >= 60 phút, kiểm tra ngày
  const handleConfirmBooking = async () => {
    const sId = studentInput.trim();
    if (!sId) {
      showToast('Vui lòng nhập MSSV hoặc Email!', 'error');
      return;
    }

    const { date, startTime, endTime } = bookingModal;

    // 1. Kiểm tra khung giờ bắt buộc từ 08:00 đến 17:00
    if (startTime < '08:00') {
      showToast('Giờ bắt đầu không được sớm hơn 08:00 sáng!', 'error');
      return;
    }

    if (endTime > '17:00') {
      showToast('Giờ kết thúc không được trễ hơn 17:00 chiều!', 'error');
      return;
    }

    // 2. Kiểm tra khoảng thời lượng tối thiểu 60 phút
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    if (diffMinutes < 60) {
      showToast('Chưa đủ thời gian tối thiểu! Vui lòng đặt tối thiểu 60 phút.', 'error');
      return;
    }

    // 3. Kiểm tra giờ quá khứ nếu người dùng đặt phòng trong HÔM NAY
    const now = new Date();
    const todayStr = getTodayStr();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (date === todayStr && startTime < currentTimeStr) {
      showToast(`Không thể đặt giờ quá khứ trong hôm nay! Hiện tại là ${currentTimeStr}.`, 'error');
      return;
    }

    try {
      await api.createBooking({
        studentId: sId,
        roomId: bookingModal.room.id,
        date: date || todayStr,
        startTime,
        endTime,
        memberCount: parseInt(memberCount) || 1
      });

      showToast(`Đặt thành công phòng ${bookingModal.room.id}!`, 'success');
      setBookingModal(prev => ({ ...prev, isOpen: false }));
      
      handleStudentAction();
      loadData();
      setActiveTab('home');
    } catch (err) {
      showToast(err.message || 'Lỗi khi đặt phòng!', 'error');
    }
  };

  const handleCheckIn = async (bId) => {
    try {
      await api.checkIn(bId);
      showToast('Xác nhận mượn phòng thành công!', 'success');
      handleStudentAction();
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCheckOut = async (bId) => {
    try {
      await api.checkOut(bId);
      showToast('Trả phòng thành công! Đã giải phóng phòng.', 'success');
      handleStudentAction();
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleTimeoutNoShow = async (bId) => {
    await api.timeoutNoShow(bId);
    showToast('Quá 10 phút không nhận phòng: Hủy phòng & phạt vi phạm!', 'error');
    handleStudentAction();
    loadData();
  };

  const handleTimeoutLateCheckOut = async (bId) => {
    await api.timeoutLateCheckout(bId);
    showToast('Lố 30 phút không trả phòng: Phạt vi phạm & giải phóng phòng!', 'error');
    handleStudentAction();
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl font-semibold text-white transition-all animate-in fade-in slide-in-from-top-3 ${
          notification.type === 'error' ? 'bg-rose-600 shadow-rose-600/30' : 
          notification.type === 'info' ? 'bg-sky-600 shadow-sky-600/30' : 
          'bg-emerald-600 shadow-emerald-600/30'
        }`}>
          {notification.msg}
        </div>
      )}

      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSchedule={() => {
          api.getScheduleMatrix(getTodayStr()).then(setScheduleMatrix);
          setShowScheduleModal(true);
        }} 
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'home' ? (
          <HomePage 
            studentInput={studentInput}
            setStudentInput={setStudentInput}
            memberCount={memberCount}
            setMemberCount={setMemberCount}
            studentStatus={studentStatus}
            handleStudentAction={handleStudentAction}
            marqueeRooms={marqueeRooms}
            onOpenBookModal={handleOpenBookModal}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onTimeoutNoShow={handleTimeoutNoShow}
            onTimeoutLateCheckOut={handleTimeoutLateCheckOut}
          />
        ) : (
          <RoomsPage 
            memberCount={memberCount}
            setMemberCount={setMemberCount}
            availableRooms={availableRooms}
            onOpenBookModal={handleOpenBookModal}
            onRefreshRooms={(c) => api.getAvailableRooms(c).then(setAvailableRooms)}
          />
        )}
      </main>

      {/* MODAL LỊCH PHÒNG TỔNG QUÁT CÓ ĐỒNG BỘ ĐỔI NGÀY */}
      <ScheduleModal 
        isOpen={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)} 
        scheduleMatrix={scheduleMatrix} 
        onDateChange={async (selectedDate) => {
          try {
            const matrix = await api.getScheduleMatrix(selectedDate);
            setScheduleMatrix(matrix);
          } catch (e) {
            console.error('Lỗi tải lịch theo ngày:', e);
          }
        }}
      />

      {/* MODAL ĐẶT PHÒNG */}
      <BookingModal 
        modalState={bookingModal}
        setModalState={setBookingModal}
        studentInput={studentInput}
        setStudentInput={setStudentInput}
        memberCount={memberCount}
        setMemberCount={setMemberCount}
        onConfirm={handleConfirmBooking}
      />
    </div>
  );
}