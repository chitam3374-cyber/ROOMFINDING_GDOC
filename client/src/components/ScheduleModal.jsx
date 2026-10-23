import React, { useState, useMemo } from 'react';
import { Calendar, X, Search, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';

export default function ScheduleModal({ isOpen, onClose, scheduleMatrix, onDateChange }) {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Sinh danh sách 14 ngày tới bắt đầu từ HÔM NAY (không hiển thị ngày quá khứ)
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
      const isoDate = `${year}-${month}-${day}`;

      const dayName = daysOfWeek[d.getDay()];
      const label = i === 0 
        ? `${dayName}, ${day}/${month}/${year} (Hôm nay)`
        : `${dayName}, ${day}/${month}/${year}`;

      dates.push({ isoDate, label, dayName, isToday: i === 0 });
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState(availableDates[0]?.isoDate || '');

  // 2. Lọc danh sách phòng theo ô tìm kiếm
  const filteredMatrix = useMemo(() => {
    if (!scheduleMatrix) return [];
    if (!searchQuery.trim()) return scheduleMatrix;
    return scheduleMatrix.filter(row => 
      row.roomId.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [scheduleMatrix, searchQuery]);

  // Xử lý đổi ngày trên dropdown
  const handleSelectDate = (newDate) => {
    setSelectedDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  if (!isOpen) return null;

  // Cấu hình trục thời gian 08:00 - 17:00 (9 tiếng = 540 phút)
  const timelineHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const DAY_START_MINUTES = 8 * 60; // 480 phút
  const TOTAL_DAY_MINUTES = 9 * 60; // 540 phút

  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const activeDateObj = availableDates.find(d => d.isoDate === selectedDate) || availableDates[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Dải thời gian phòng học
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  activeDateObj?.isToday 
                    ? 'bg-sky-100 text-sky-800 border-sky-200'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                }`}>
                  {activeDateObj?.isToday ? 'Hôm nay' : activeDateObj?.dayName}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi biểu đồ thời gian thực từ 08:00 đến 17:00
              </p>
            </div>
          </div>

          {/* CỤM ĐIỀU KHIỂN: CHỌN NGÀY & TÌM KIẾM NHANH */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* DROPDOWN CHỌN NGÀY VÀ THỨ */}
            <div className="relative min-w-[215px] w-full sm:w-auto">
              <CalendarDays className="w-4 h-4 text-sky-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedDate}
                onChange={(e) => handleSelectDate(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs cursor-pointer appearance-none"
              >
                {availableDates.map(item => (
                  <option key={item.isoDate} value={item.isoDate}>
                    {item.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Ô TÌM NHANH MÃ PHÒNG */}
            <div className="relative w-full sm:w-52">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã phòng (VD: A1.101)..." 
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* NÚT ĐÓNG MODAL */}
            <button 
              type="button"
              onClick={onClose} 
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
            >
              <X className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>

        {/* BẢNG TIMELINE DẢI THỜI GIAN LIÊN TỤC */}
        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[62vh] p-4 sm:p-6">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs min-w-[760px]">
            
            {/* THƯỚC ĐO THỜI GIAN TRÊN CÙNG (08:00 - 17:00) */}
            <div className="sticky top-0 bg-slate-900 text-white z-20 shadow-md flex items-center py-3 px-4 border-b border-slate-800">
              <div className="w-32 text-xs font-black uppercase tracking-wider pl-2 text-slate-300">
                Phòng
              </div>
              <div className="flex-1 flex justify-between pr-2 text-[11px] font-bold text-slate-300 font-mono">
                {timelineHours.map((hour) => (
                  <div key={hour} className="flex flex-col items-center">
                    <span>{hour}</span>
                    <span className="w-0.5 h-1.5 bg-slate-600 mt-1"></span>
                  </div>
                ))}
              </div>
            </div>

            {/* DANH SÁCH DẢI THỜI GIAN CỦA TỪNG PHÒNG */}
            <div className="divide-y divide-slate-100 bg-white">
              {filteredMatrix.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-semibold">
                  Không tìm thấy phòng nào khớp với "{searchQuery}"
                </div>
              ) : (
                filteredMatrix.map((row) => {
                  const bookings = row.bookings || [];
                  const isFullyFree = bookings.length === 0;

                  return (
                    <div key={row.roomId} className="flex items-center py-3.5 px-4 hover:bg-slate-50/80 transition-colors">
                      {/* Cột mã phòng */}
                      <div className="w-32 pr-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-black text-xs font-mono shadow-2xs">
                          {row.roomId}
                        </span>
                      </div>

                      {/* Thanh Timeline trải dài */}
                      <div className="flex-1 relative h-9 bg-emerald-50/90 border border-emerald-200/90 rounded-xl overflow-hidden shadow-inner flex items-center">
                        {/* Vạch kẻ chia giờ mờ đằng sau */}
                        <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="w-px h-full border-r border-dashed border-emerald-200/50"></div>
                          ))}
                        </div>

                        {/* Nếu phòng trống cả ngày */}
                        {isFullyFree ? (
                          <div className="w-full text-center text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 z-10">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Trống suốt ngày (08:00 - 17:00)</span>
                          </div>
                        ) : (
                          // Vẽ các đoạn màu đỏ tương ứng với các khung giờ đã đặt
                          bookings.map((b, bIdx) => {
                            const startM = Math.max(DAY_START_MINUTES, toMinutes(b.startTime));
                            const endM = Math.min(DAY_START_MINUTES + TOTAL_DAY_MINUTES, toMinutes(b.endTime));

                            const leftPercent = Math.max(0, ((startM - DAY_START_MINUTES) / TOTAL_DAY_MINUTES) * 100);
                            const widthPercent = Math.max(0, ((endM - startM) / TOTAL_DAY_MINUTES) * 100);

                            return (
                              <div
                                key={bIdx}
                                style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                className="absolute top-0 bottom-0 bg-gradient-to-r from-rose-500 to-rose-600 border-x border-rose-700/30 text-white flex items-center justify-center px-1 text-[11px] font-bold shadow-md z-10 transition-all hover:brightness-110"
                                title={`Đã đặt: ${b.startTime} - ${b.endTime}`}
                              >
                                <span className="truncate drop-shadow-xs">
                                  Đã đặt ({b.startTime} - {b.endTime})
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* FOOTER MODAL CHÚ THÍCH */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Đang xem lịch: <strong className="text-slate-900 font-bold">{activeDateObj?.label}</strong></span>
            <span>•</span>
            <span>Hiển thị: <strong className="text-slate-900 font-bold">{filteredMatrix.length}</strong> / {scheduleMatrix?.length || 0} phòng</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-300 inline-block"></span>
              Đoạn xanh: Trống (Có thể đặt)
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-rose-700">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-500 inline-block shadow-xs"></span>
              Đoạn đỏ: Đã được đặt
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}