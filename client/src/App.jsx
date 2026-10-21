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

  const loadData = async () => {
    try {
      const [marquee, matrix, available] = await Promise.all([
        api.getMarqueeRooms(),
        api.getScheduleMatrix(),
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

  const handleOpenBookModal = (room, isQuick = false) => {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour >= 17) {
      showToast('Hệ thống đã đóng cổng đặt phòng sau 17 giờ !', 'error');
      return;
    }

    const startHour = Math.max(8, currentHour);
    const endHour = Math.min(17, startHour + 2);

    setBookingModal({
      isOpen: true,
      room,
      isQuickBook: isQuick,
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${endHour.toString().padStart(2, '0')}:00`
    });
  };

  const handleConfirmBooking = async () => {
    const sId = studentInput.trim();
    if (!sId) {
      showToast('Vui lòng nhập MSSV!', 'error');
      return;
    }
    // 1. Chuyển đổi giờ thành phút để tính khoảng cách
    const [startH, startM] = bookingModal.startTime.split(':').map(Number);
    const [endH, endM] = bookingModal.endTime.split(':').map(Number);
    
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const diffMinutes = endTotal - startTotal;

    // 2. Chặn nếu chọn thời lượng dưới 60 phút
    if (diffMinutes < 60) {
      showToast('Chưa đủ thời gian tối thiểu! Vui lòng đặt tối thiểu 60 phút.', 'error');
      return;
    }
    
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (now.getHours() >= 17) {
      showToast('Hệ thống đã đóng cổng đặt phòng sau 17 giờ!', 'error');
      return;
    }

    if (bookingModal.startTime < currentTimeStr) {
      showToast(`Không thể đặt giờ quá khứ! Hiện tại là ${currentTimeStr}`, 'error');
      return;
    }

    try {
      await api.createBooking({
        studentId: sId,
        roomId: bookingModal.room.id,
        startTime: bookingModal.startTime,
        endTime: bookingModal.endTime,
        memberCount: parseInt(memberCount) || 1
      });

      showToast(`Đặt thành công phòng ${bookingModal.room.id}!`, 'success');
      setBookingModal({ ...bookingModal, isOpen: false });
      
      handleStudentAction();
      loadData();
      setActiveTab('home');
    } catch (err) {
      showToast(err.message, 'error');
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
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl font-medium text-white transition-all ${
          notification.type === 'error' ? 'bg-red-600' : notification.type === 'info' ? 'bg-sky-600' : 'bg-emerald-600'
        }`}>
          {notification.msg}
        </div>
      )}

      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSchedule={() => {
          api.getScheduleMatrix().then(setScheduleMatrix);
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

      <ScheduleModal 
        isOpen={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)} 
        scheduleMatrix={scheduleMatrix} 
      />

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