import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { api } from './services/api';
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import ScheduleModal from './components/ScheduleModal';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import DevPage from './pages/DevPage';

export default function App() {
  const navigate = useNavigate();
  const [studentInput, setStudentInput] = useState('');
  const [memberCount, setMemberCount] = useState('');
  
  const [marqueeRooms, setMarqueeRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [scheduleMatrix, setScheduleMatrix] = useState([]);
  const [studentStatus, setStudentStatus] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Auth: Quản lý người dùng đã đăng nhập bằng Email sinh viên IU
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('iurp_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['ITITIU25055', 'ADMIN001'].includes(parsed.studentId)) {
          parsed.role = 'admin';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [authModal, setAuthModal] = useState({
    isOpen: false,
    initialTab: 'login'
  });

  const handleOpenAuth = (tab = 'login') => {
    setAuthModal({ isOpen: true, initialTab: tab });
  };

  const handleCloseAuth = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('iurp_user', JSON.stringify(user));
    } catch {}
    setStudentInput(user.studentId);
    showToast(`Xin chào ${user.fullName}! Đăng nhập thành công.`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('iurp_user');
    } catch {}
    setStudentInput('');
    setStudentStatus(null);
    showToast('Đã đăng xuất tài khoản thành công.', 'info');
  };

  // Tự động tải thông tin chế tài và đơn đặt phòng khi tài khoản thay đổi
  useEffect(() => {
    if (currentUser && currentUser.studentId) {
      setStudentInput(currentUser.studentId);
      api.checkStudent(currentUser.studentId)
        .then(data => setStudentStatus(data))
        .catch(err => console.error('Lỗi nạp thông tin sinh viên:', err));
    } else {
      setStudentStatus(null);
    }
  }, [currentUser]);

  // DevMode: Giả lập thời gian để test sau 17:00
  const [devMode, setDevMode] = useState(() => {
    try {
      const saved = localStorage.getItem('iurp_devmode');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.enabled && parsed.customTime) {
          return {
            ...parsed,
            baseTime: parsed.customTime,
            setAt: Date.now()
          };
        }
        return parsed;
      }
    } catch {}
    const now = new Date();
    const realTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    return { enabled: false, customTime: realTime, baseTime: realTime, setAt: Date.now() };
  });

  // DevMode ticker: Tự động chạy tiếp giờ Dev Mode từng giây một mà không bị đứng im
  useEffect(() => {
    if (!devMode.enabled) return;

    const interval = setInterval(() => {
      setDevMode((prev) => {
        if (!prev.enabled) return prev;

        const base = prev.baseTime || prev.customTime || '09:00:00';
        const [h, m, s] = base.split(':').map(Number);
        const baseSecs = (h || 0) * 3600 + (m || 0) * 60 + (s || 0);

        const setAt = prev.setAt || Date.now();
        const elapsedSecs = Math.floor((Date.now() - setAt) / 1000);
        const currentTotalSecs = (baseSecs + elapsedSecs) % 86400;

        const curH = Math.floor(currentTotalSecs / 3600);
        const curM = Math.floor((currentTotalSecs % 3600) / 60);
        const curS = currentTotalSecs % 60;

        const tickingTime = `${String(curH).padStart(2, '0')}:${String(curM).padStart(2, '0')}:${String(curS).padStart(2, '0')}`;

        if (tickingTime === prev.customTime) return prev;
        return {
          ...prev,
          customTime: tickingTime
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [devMode.enabled]);

  // Đồng bộ devMode sang api service
  useEffect(() => {
    if (devMode.enabled && devMode.customTime) {
      api.setDevTime(devMode.customTime);
    } else {
      api.setDevTime(null);
    }
    try {
      localStorage.setItem('iurp_devmode', JSON.stringify({
        enabled: devMode.enabled,
        customTime: devMode.customTime,
        baseTime: devMode.customTime,
        setAt: Date.now()
      }));
    } catch {}
  }, [devMode.enabled, devMode.customTime]);

  // Lấy ngày hôm nay YYYY-MM-DD theo giờ địa phương
  const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Lấy thời gian hiệu lực hiện tại (giờ thực hoặc giờ Dev giả lập)
  const getCurrentEffectiveTime = () => {
    if (devMode.enabled && devMode.customTime) {
      return devMode.customTime.slice(0, 5);
    }
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
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

  // Định kỳ tự động đồng bộ realtime trạng thái đơn phòng và phòng chạy mỗi 5 giây
  useEffect(() => {
    const pollTimer = setInterval(() => {
      api.getMarqueeRooms().then(setMarqueeRooms).catch(() => {});
      if (currentUser?.studentId) {
        api.checkStudent(currentUser.studentId).then(data => {
          setStudentStatus(data);
        }).catch(() => {});
      }
    }, 5000);

    return () => clearInterval(pollTimer);
  }, [currentUser]);

  // Tra cứu MSSV: Tự động kiểm tra trạng thái đăng nhập
  const handleStudentAction = async () => {
    if (!currentUser) {
      showToast('Vui lòng đăng nhập bằng Email sinh viên IU (@student.hcmiu.edu.vn)!', 'info');
      handleOpenAuth('login');
      return;
    }

    const cleanId = currentUser.studentId;
    setStudentInput(cleanId);

    try {
      const data = await api.checkStudent(cleanId);
      setStudentStatus(data);

      if (data.hasActiveBooking) {
        showToast('Đã tìm thấy thông tin đơn phòng bạn đang đặt!', 'info');
      } else {
        navigate('/rooms');
        const rooms = await api.getAvailableRooms(memberCount);
        setAvailableRooms(rooms);
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ!', 'error');
    }
  };

  // Mở Modal đặt phòng và tự tính khung giờ hợp lệ
  const handleOpenBookModal = (room, isQuick = false) => {
    if (!currentUser) {
      showToast('Vui lòng đăng nhập tài khoản sinh viên IU để đặt phòng!', 'info');
      handleOpenAuth('login');
      return;
    }

    const todayStr = getTodayStr();
    const effectiveTime = getCurrentEffectiveTime();
    const currentHour = parseInt(effectiveTime.split(':')[0], 10);

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

  // Xác nhận đặt phòng: Chuẩn hóa MSSV in hoa & kiểm tra ràng buộc 08:00 - 17:00, >= 60 phút
  const handleConfirmBooking = async () => {
    if (!currentUser) {
      showToast('Vui lòng đăng nhập để hoàn tất đặt phòng!', 'error');
      handleOpenAuth('login');
      return;
    }

    const sId = currentUser.studentId;
    const sEmail = currentUser.email;

    setStudentInput(sId);
    const { date, startTime, endTime } = bookingModal;

    if (startTime < '08:00') {
      showToast('Giờ bắt đầu không được sớm hơn 08:00 sáng!', 'error');
      return;
    }

    if (endTime > '17:00') {
      showToast('Giờ kết thúc không được trễ hơn 17:00 chiều!', 'error');
      return;
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    if (diffMinutes < 60) {
      showToast('Chưa đủ thời gian tối thiểu! Vui lòng đặt tối thiểu 60 phút.', 'error');
      return;
    }

    const todayStr = getTodayStr();
    const currentTimeStr = getCurrentEffectiveTime();

    if (date === todayStr && startTime < currentTimeStr) {
      showToast(`Không thể đặt giờ quá khứ trong hôm nay! Giờ đang tính là ${currentTimeStr}.`, 'error');
      return;
    }

    try {
      const res = await api.createBooking({
        studentId: sId,
        studentEmail: sEmail,
        roomId: bookingModal.room.id,
        date: date || todayStr,
        startTime,
        endTime,
        memberCount: parseInt(memberCount, 10) || 1
      });

      showToast(`Đặt thành công phòng ${bookingModal.room.id}!`, 'success');
      setBookingModal(prev => ({ ...prev, isOpen: false }));
      
      // 1. Cập nhật ngay lập tức đơn phòng vào state để hiển thị banner Realtime trên HomePage
      if (res?.booking) {
        setStudentStatus(prev => ({
          ...(prev || {}),
          hasActiveBooking: true,
          booking: res.booking
        }));
      }

      // 2. Tải lại toàn bộ dữ liệu (cả ma trận lịch theo ngày đặt, phòng chạy, phòng trống và thông tin sinh viên)
      const targetDate = date || todayStr;
      const [marquee, matrix, available, studentInfo] = await Promise.all([
        api.getMarqueeRooms(),
        api.getScheduleMatrix(targetDate),
        api.getAvailableRooms(memberCount),
        api.checkStudent(sId)
      ]);

      setMarqueeRooms(marquee);
      setScheduleMatrix(matrix);
      setAvailableRooms(available);
      if (studentInfo) {
        setStudentStatus(studentInfo);
      }

      navigate('/homepage');
    } catch (err) {
      showToast(err.message || 'Lỗi khi đặt phòng!', 'error');
    }
  };

  // Xử lý HỦY PHÒNG: Xóa trạng thái đơn ngay lập tức và đảm bảo trở về trang chủ
  const handleCancelBooking = async (bId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn đặt phòng này?')) {
      return;
    }

    const cleanId = studentInput.trim().toUpperCase();

    try {
      const res = await api.cancelBooking(bId, cleanId);
      if (res.isWarning) {
        showToast(res.message, 'warning');
      } else {
        showToast(res.message || `Hủy thành công! Bạn còn ${res.remainingCancels} lần hủy hôm nay.`, 'info');
      }

      // 1. Reset state ngay lập tức để ẩn banner đặt phòng và chuyển nút thành "ĐẶT PHÒNG"
      setStudentStatus((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          hasActiveBooking: false,
          booking: null
        };
      });

      // 2. Tải lại dữ liệu ma trận và phòng trống
      await loadData();

      // 3. Truy vấn lại thông tin sinh viên để đồng bộ lịch sử vi phạm
      if (cleanId) {
        const updatedStatus = await api.checkStudent(cleanId);
        setStudentStatus(updatedStatus);
      }

      // 4. Đảm bảo giao diện quay về trang chủ
      navigate('/homepage');
    } catch (err) {
      showToast(err.message || 'Lỗi khi hủy phòng!', 'error');
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

    // Reset đơn phòng khỏi giao diện khi bị phạt no-show
    setStudentStatus((prev) => prev ? { ...prev, hasActiveBooking: false, booking: null } : null);

    const cleanId = studentInput.trim().toUpperCase();
    if (cleanId) {
      const updatedStatus = await api.checkStudent(cleanId);
      setStudentStatus(updatedStatus);
    }
    loadData();
    navigate('/homepage');
  };

  const handleTimeoutLateCheckOut = async (bId) => {
    await api.timeoutLateCheckout(bId);
    showToast('Lố 30 phút không trả phòng: Phạt vi phạm & giải phóng phòng!', 'error');

    setStudentStatus((prev) => prev ? { ...prev, hasActiveBooking: false, booking: null } : null);

    const cleanId = studentInput.trim().toUpperCase();
    if (cleanId) {
      const updatedStatus = await api.checkStudent(cleanId);
      setStudentStatus(updatedStatus);
    }
    loadData();
    navigate('/homepage');
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
        onOpenSchedule={() => {
          api.getScheduleMatrix(getTodayStr()).then(setScheduleMatrix);
          setShowScheduleModal(true);
        }} 
        devMode={devMode}
        setDevMode={setDevMode}
        activeBooking={studentStatus?.booking}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/homepage" replace />} />
          <Route 
            path="/homepage" 
            element={
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
                onCancelBooking={handleCancelBooking}
                onTimeoutNoShow={handleTimeoutNoShow}
                onTimeoutLateCheckOut={handleTimeoutLateCheckOut}
                simulatedTime={devMode.enabled ? devMode.customTime : null}
                currentUser={currentUser}
                onOpenAuth={handleOpenAuth}
                onLogout={handleLogout}
              />
            } 
          />
          <Route 
            path="/rooms" 
            element={
              <RoomsPage 
                memberCount={memberCount}
                setMemberCount={setMemberCount}
                availableRooms={availableRooms}
                onOpenBookModal={handleOpenBookModal}
                onRefreshRooms={(c) => api.getAvailableRooms(c).then(setAvailableRooms)}
              />
            } 
          />
          <Route 
            path="/devpage" 
            element={
              <DevPage 
                currentUser={currentUser} 
                simulatedTime={devMode.enabled ? devMode.customTime : null} 
              />
            } 
          />
          <Route path="*" element={<Navigate to="/homepage" replace />} />
        </Routes>
      </main>

      {/* MODAL LỊCH PHÒNG TỔNG QUÁT DẠNG TIMELINE */}
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
        currentUser={currentUser}
      />

      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ EMAIL SINH VIÊN IU */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialTab={authModal.initialTab}
        onClose={handleCloseAuth}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}