import React, { useMemo } from 'react';
import { Calendar, X, Clock, AlertCircle, CalendarDays } from 'lucide-react';

export default function BookingModal({
  modalState,
  setModalState,
  studentInput,
  setStudentInput,
  memberCount,
  setMemberCount,
  onConfirm,
  currentUser
}) {
  if (!modalState.isOpen) return null;

  // 1. Tạo danh sách 14 ngày tới bắt đầu từ HÔM NAY (không hiển thị ngày quá khứ)
  const availableDates = useMemo(() => {
    const dates = [];
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const now = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`; // Định dạng YYYY-MM-DD

      const dayName = daysOfWeek[d.getDay()];
      const label = i === 0 
        ? `${dayName}, ${day}/${month}/${year} (Hôm nay)`
        : `${dayName}, ${day}/${month}/${year}`;

      dates.push({ isoDate, label });
    }
    return dates;
  }, []);

  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const toTimeStr = (totalMinutes) => {
    const clamped = Math.min(17 * 60, Math.max(8 * 60, totalMinutes));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleStartTimeChange = (newStart) => {
    let clampedStart = newStart;
    if (clampedStart < '08:00') clampedStart = '08:00';
    if (clampedStart > '16:00') clampedStart = '16:00';

    const startMins = toMinutes(clampedStart);
    const currentEndMins = toMinutes(modalState.endTime);

    let newEndMins = currentEndMins;
    if (currentEndMins - startMins < 60) {
      newEndMins = Math.min(17 * 60, startMins + 60);
    }

    setModalState({
      ...modalState,
      startTime: clampedStart,
      endTime: toTimeStr(newEndMins)
    });
  };

  const handleEndTimeChange = (newEnd) => {
    let clampedEnd = newEnd;
    if (clampedEnd > '17:00') clampedEnd = '17:00';
    if (clampedEnd < '09:00') clampedEnd = '09:00';

    const startMins = toMinutes(modalState.startTime);
    let endMins = toMinutes(clampedEnd);

    if (endMins - startMins < 60) {
      endMins = Math.min(17 * 60, startMins + 60);
      clampedEnd = toTimeStr(endMins);
    }

    setModalState({
      ...modalState,
      endTime: clampedEnd
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 relative">
        
        {/* NÚT ĐÓNG NHANH */}
        <button 
          type="button"
          onClick={() => setModalState({ ...modalState, isOpen: false })}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5 shrink-0" />
        </button>

        {/* HEADER MODAL */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Xác nhận đặt phòng</h3>
            <p className="text-xs text-slate-500">Khung giờ hoạt động: 08:00 - 17:00</p>
          </div>
        </div>

        {/* THẺ THÔNG TIN PHÒNG */}
        <div className="p-4 bg-gradient-to-br from-slate-50 to-sky-50/40 rounded-2xl border border-slate-200/80 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-black text-slate-900 font-mono tracking-wide">
              Phòng: <span className="text-sky-700">{modalState.room?.id}</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Khả dụng
            </span>
          </div>
          <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
            <span>{modalState.room?.category || 'Phòng học nhóm'}</span>
            <span>•</span>
            <span>Sức chứa: <strong>{modalState.room?.capacity || 6} người</strong></span>
          </div>
        </div>

        {/* THÔNG TIN TÀI KHOẢN SINH VIÊN ĐẶT PHÒNG */}
        {currentUser && (
          <div className="p-3 bg-sky-50/80 border border-sky-200/80 rounded-2xl mb-4 flex items-center justify-between text-xs shadow-2xs">
            <div>
              <span className="text-slate-500 font-medium">Tài khoản đặt:</span>{' '}
              <strong className="text-slate-900">{currentUser.fullName}</strong>{' '}
              <span className="font-mono text-sky-700 font-bold">({currentUser.studentId})</span>
            </div>
            <span className="text-[10px] font-mono text-sky-800 bg-white px-2 py-0.5 rounded-full border border-sky-200">
              {currentUser.email}
            </span>
          </div>
        )}

        {/* Ô CHỌN NGÀY VÀ THỨ (CHỈ TỪ HÔM NAY TRỞ ĐI) */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
            Ngày & Thứ đặt phòng
          </label>
          <div className="relative">
            <select
              value={modalState.date || availableDates[0]?.isoDate}
              onChange={(e) => setModalState({ ...modalState, date: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner bg-slate-50/50 focus:bg-white text-slate-800 cursor-pointer appearance-none"
            >
              {availableDates.map(item => (
                <option key={item.isoDate} value={item.isoDate}>
                  {item.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* NẾU LÀ ĐẶT NHANH THÌ NHẬP MSSV VÀ SỐ NGƯỜI */}
        {modalState.isQuickBook && (
          <div className="space-y-3.5 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Mã số sinh viên (MSSV)</label>
              <input 
                type="text" 
                value={studentInput} 
                onChange={(e) => setStudentInput(e.target.value)}
                placeholder="VD: 20000 hoặc ITITIU20000"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner bg-slate-50/50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Số lượng người tham gia</label>
              <input 
                type="number" 
                min="1"
                max={modalState.room?.capacity || 50}
                value={memberCount} 
                onChange={(e) => setMemberCount(e.target.value)}
                placeholder="VD: 4"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* BỘ CHỌN KHUNG GIỜ (08:00 - 17:00, TỐI THIỂU 60 PHÚT) */}
        <div className="mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-600" /> Giờ bắt đầu
              </label>
              <input 
                type="time" 
                min="08:00"
                max="16:00"
                value={modalState.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner bg-slate-50/50 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Giờ kết thúc
              </label>
              <input 
                type="time" 
                min="09:00"
                max="17:00"
                value={modalState.endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner bg-slate-50/50 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Chỉ được chọn từ <strong>08:00</strong> đến <strong>17:00</strong> (Tối thiểu 60 phút).</span>
          </div>
        </div>

        {/* NÚT ĐIỀU HƯỚNG */}
        <div className="flex justify-end items-center gap-3 pt-2 border-t border-slate-100">
          <button 
            onClick={() => setModalState({ ...modalState, isOpen: false })}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 active:scale-95 transition cursor-pointer"
          >
            Hủy
          </button>
          <button 
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-900 hover:from-sky-500 hover:to-indigo-950 text-white text-sm font-bold shadow-md shadow-sky-500/20 active:scale-95 transition duration-200 cursor-pointer"
          >
            Đồng ý đặt
          </button>
        </div>

      </div>
    </div>
  );
}