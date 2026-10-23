import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Users, Key, DoorClosed, AlertTriangle, Calendar, Timer } from 'lucide-react';

export default function BookingBanner({ booking, onCheckIn, onCheckOut, onTimeoutNoShow, onTimeoutLateCheckOut, simulatedTime }) {
  // Ẩn hoàn toàn khung banner nếu không có đơn hoặc đơn đã bị hủy
  if (!booking || booking.status === 'CANCELLED') return null;

  // Live timer đếm mỗi giây để countdown chuyển động mượt mà
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toTimeStr = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (diffSeconds) => {
    if (diffSeconds <= 0) return '00:00:00';
    const h = Math.floor(diffSeconds / 3600);
    const m = Math.floor((diffSeconds % 3600) / 60);
    const s = Math.floor(diffSeconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tính cửa sổ thời gian kích hoạt nút & cảnh báo
  const getTimeWindowStatus = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const bookingDate = booking.date || todayStr;
    const isFutureDate = bookingDate > todayStr;
    const isPastDate = bookingDate < todayStr;
    const isToday = bookingDate === todayStr;

    let currentSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let currentMins = now.getHours() * 60 + now.getMinutes();

    if (simulatedTime) {
      const parts = simulatedTime.split(':').map(Number);
      const simH = parts[0] || 0;
      const simM = parts[1] || 0;
      const simS = parts.length > 2 ? parts[2] : (ticker % 60);
      currentMins = simH * 60 + simM;
      currentSecs = simH * 3600 + simM * 60 + simS;
    }

    const [startH, startM] = (booking.startTime || '08:00').split(':').map(Number);
    const startMins = startH * 60 + startM;
    const startSecs = startH * 3600 + startM * 60;

    const [endH, endM] = (booking.endTime || '10:00').split(':').map(Number);
    const endMins = endH * 60 + endM;
    const endSecs = endH * 3600 + endM * 60;

    const checkInOpenSecs = startSecs - 10 * 60;
    const checkInDeadlineSecs = startSecs + 10 * 60;
    const checkOutOpenSecs = endSecs - 30 * 60;
    const checkOutDeadlineSecs = endSecs + 30 * 60;

    // QUAN TRỌNG: Chỉ xét quá hạn hoặc đến hạn nếu là ngày hôm nay hoặc ngày quá khứ
    const isNoShowOverdue = booking.status === 'BOOKED' && (
      isPastDate || (isToday && currentMins > (startMins + 10))
    );

    const isLateCheckoutOverdue = booking.status === 'CHECKED_IN' && (
      isPastDate || (isToday && currentMins > (endMins + 30))
    );

    const isInCheckInWindow = booking.status === 'BOOKED' && isToday &&
                              currentMins >= (startMins - 10) && 
                              currentMins <= (startMins + 10);

    const isInCheckOutWindow = booking.status === 'CHECKED_IN' && isToday &&
                               currentMins >= (endMins - 30) && 
                               currentMins <= (endMins + 30);

    let checkInMsg = '';
    if (isFutureDate) {
      checkInMsg = `(Chưa đến ngày ${bookingDate})`;
    } else if (isNoShowOverdue) {
      checkInMsg = '(Đã quá 10 phút - Không thể nhận)';
    } else if (currentMins < startMins - 10) {
      checkInMsg = `(Kích hoạt lúc ${toTimeStr(startMins - 10)})`;
    } else if (isInCheckInWindow) {
      checkInMsg = '(Đang trong khung giờ)';
    }

    let checkOutMsg = '';
    if (isFutureDate) {
      checkOutMsg = `(Chưa đến ngày ${bookingDate})`;
    } else if (isLateCheckoutOverdue) {
      checkOutMsg = '(Đã quá 30 phút - Trễ hạn)';
    } else if (currentMins < endMins - 30) {
      checkOutMsg = `(Kích hoạt lúc ${toTimeStr(endMins - 30)})`;
    } else if (isInCheckOutWindow) {
      checkOutMsg = '(Đang trong khung giờ)';
    }

    // TÍNH TOÁN ĐẾM NGƯỢC KHUNG GIỜ THỰC TẾ
    let countdownData = null;

    if (isToday) {
      if (booking.status === 'BOOKED') {
        if (currentSecs < checkInOpenSecs) {
          countdownData = {
            title: 'Mở nhận phòng sau',
            value: formatCountdown(checkInOpenSecs - currentSecs),
            sub: `Kích hoạt lúc ${toTimeStr(startMins - 10)} (trước 10 phút)`,
            type: 'info'
          };
        } else if (currentSecs <= checkInDeadlineSecs) {
          countdownData = {
            title: 'Hạn chót nhận phòng còn',
            value: formatCountdown(checkInDeadlineSecs - currentSecs),
            sub: 'Vui lòng bấm Xác nhận đã mượn phòng (Quá giờ sẽ bị phạt No-Show!)',
            type: 'urgent'
          };
        }
      } else if (booking.status === 'CHECKED_IN') {
        if (currentSecs < checkOutOpenSecs) {
          countdownData = {
            title: 'Mở trả phòng sớm sau',
            value: formatCountdown(checkOutOpenSecs - currentSecs),
            sub: `Kích hoạt lúc ${toTimeStr(endMins - 30)} (trước 30 phút) • Ca kết thúc: ${booking.endTime}`,
            type: 'info'
          };
        } else if (currentSecs <= checkOutDeadlineSecs) {
          const isOverEndTime = currentSecs >= endSecs;
          countdownData = {
            title: isOverEndTime ? 'Hạn chót trả phòng còn' : 'Khung giờ trả phòng (kết thúc sau)',
            value: formatCountdown(checkOutDeadlineSecs - currentSecs),
            sub: isOverEndTime
              ? 'Ca mượn đã kết thúc. Vui lòng bấm Xác nhận trả phòng (Quá 30p sẽ bị phạt trễ!)'
              : `Có thể trả phòng sớm ngay bây giờ (Hạn chót: ${toTimeStr(endMins + 30)})`,
            type: isOverEndTime ? 'urgent' : 'active'
          };
        }
      }
    }

    return { 
      canCheckIn: isInCheckInWindow, 
      canCheckOut: isInCheckOutWindow, 
      isFutureDate,
      isNoShowOverdue, 
      isLateCheckoutOverdue,
      isInCheckInWindow,
      isInCheckOutWindow,
      checkInMsg, 
      checkOutMsg,
      currentMins,
      startMins,
      endMins,
      bookingDate,
      countdownData
    };
  };

  const { 
    canCheckIn, 
    canCheckOut, 
    isFutureDate,
    isNoShowOverdue, 
    isLateCheckoutOverdue,
    isInCheckInWindow,
    isInCheckOutWindow,
    checkInMsg, 
    checkOutMsg,
    currentMins,
    startMins,
    endMins,
    bookingDate,
    countdownData
  } = getTimeWindowStatus();

  return (
    <div className={`mt-8 border-2 rounded-3xl p-5 sm:p-6 transition-all ${
      isNoShowOverdue || isLateCheckoutOverdue 
        ? 'border-rose-400 bg-rose-50/50 shadow-md shadow-rose-500/10' 
        : isFutureDate
        ? 'border-sky-300 bg-sky-50/40 shadow-sm'
        : 'border-dashed border-sky-400 bg-sky-50/50 shadow-sm'
    }`}>
      <div className="flex items-start gap-3.5">
        <div className={`p-2 rounded-2xl mt-0.5 shrink-0 ${
          isNoShowOverdue || isLateCheckoutOverdue 
            ? 'bg-rose-100 text-rose-600 shadow-xs' 
            : isFutureDate
            ? 'bg-sky-100 text-sky-600 shadow-xs'
            : 'bg-emerald-100 text-emerald-600 shadow-xs'
        }`}>
          {isNoShowOverdue || isLateCheckoutOverdue ? <AlertTriangle className="w-5 h-5" /> : isFutureDate ? <Calendar className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
              Phòng đang mượn: <span className="text-sky-700 font-mono">{booking.roomId}</span>
            </h3>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-2xs ${
              isFutureDate
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : isNoShowOverdue 
                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' 
                : isLateCheckoutOverdue 
                ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' 
                : booking.status === 'CHECKED_IN' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isFutureDate
                ? `📅 Lịch hẹn (${bookingDate})`
                : isNoShowOverdue 
                ? '🚨 Quá 10p nhận phòng' 
                : isLateCheckoutOverdue 
                ? '🚨 Quá 30p trả phòng' 
                : booking.status === 'CHECKED_IN' 
                ? '✅ Đang sử dụng phòng' 
                : '⏳ Chờ nhận phòng'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 mt-1.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Thời gian: <strong>{booking.startTime} - {booking.endTime}</strong>, ngày <strong>{booking.date}</strong></span>
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Quy mô: <strong>{booking.memberCount} thành viên</strong></span>
          </p>

          {/* ĐỒNG HỒ ĐẾM NGƯỢC KHUNG GIỜ REAL-TIME (TÍNH THEO GIÂY) */}
          {countdownData && (
            <div className={`mt-3.5 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
              countdownData.type === 'urgent'
                ? 'bg-rose-50 border-rose-200/90 text-rose-900 animate-pulse'
                : countdownData.type === 'active'
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-sky-50/90 border-sky-200 text-sky-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-xl shrink-0 ${
                  countdownData.type === 'urgent'
                    ? 'bg-rose-200/70 text-rose-700'
                    : countdownData.type === 'active'
                    ? 'bg-emerald-200/70 text-emerald-700'
                    : 'bg-sky-200/70 text-sky-700'
                }`}>
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <span>{countdownData.title}</span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5 font-medium leading-tight">
                    {countdownData.sub}
                  </div>
                </div>
              </div>

              {/* MÀN HÌNH LED ĐẾM NGƯỢC */}
              <div className="font-mono text-xl sm:text-2xl font-black tracking-widest text-center px-4 py-1.5 rounded-xl bg-slate-900 text-amber-400 shadow-inner shrink-0 border border-slate-700/60">
                {countdownData.value}
              </div>
            </div>
          )}

          {/* THÔNG BÁO LỊCH ĐẶT TRƯỚC TRONG TƯƠNG LAI */}
          {isFutureDate && (
            <div className="mt-3.5 p-3 bg-sky-50 border border-sky-200/90 rounded-2xl flex items-center gap-2.5 text-sky-900 text-xs">
              <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Lịch hẹn đặt trước cho ngày <strong>{bookingDate}</strong> (từ <strong>{booking.startTime} đến {booking.endTime}</strong>). Nút nhận phòng sẽ tự động kích hoạt vào đúng ngày này!
              </span>
            </div>
          )}

          {/* CẢNH BÁO QUÁ 10 PHÚT CHƯA NHẬN PHÒNG */}
          {isNoShowOverdue && (
            <div className="mt-4 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-rose-700 text-sm">
                  🚨 CẢNH BÁO: ĐÃ QUÁ 10 PHÚT CHƯA XÁC NHẬN NHẬN PHÒNG!
                </p>
                <p className="mt-1 text-rose-600 leading-relaxed">
                  Ca mượn phòng bắt đầu lúc <strong>{booking.startTime}</strong> ngày <strong>{bookingDate}</strong> (quá hạn 10 phút lúc {toTimeStr(startMins + 10)}). 
                  Giờ hệ thống hiện tại là <strong>{simulatedTime || toTimeStr(currentMins)}</strong>. 
                  Theo quy định, đơn sẽ bị <strong>HỦY</strong> và bạn bị phạt vi phạm No-Show!
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button 
                    onClick={() => onTimeoutNoShow(booking.id)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition active:scale-95 cursor-pointer shadow-xs text-xs"
                  >
                    Xử lý hủy phòng & Ghi nhận phạt No-Show
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CẢNH BÁO QUÁ 30 PHÚT CHƯA TRẢ PHÒNG */}
          {isLateCheckoutOverdue && (
            <div className="mt-4 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-amber-800 text-sm">
                  🚨 CẢNH BÁO: ĐÃ TRỄ HẠN TRẢ PHÒNG QUÁ 30 PHÚT!
                </p>
                <p className="mt-1 text-amber-700 leading-relaxed">
                  Ca mượn phòng kết thúc lúc <strong>{booking.endTime}</strong> ngày <strong>{bookingDate}</strong> (quá hạn 30 phút lúc {toTimeStr(endMins + 30)}). 
                  Giờ hệ thống hiện tại là <strong>{simulatedTime || toTimeStr(currentMins)}</strong>. 
                  Bạn đang bị ghi nhận phạt trả phòng trễ hạn!
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button 
                    onClick={() => onTimeoutLateCheckOut(booking.id)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition active:scale-95 cursor-pointer shadow-xs text-xs"
                  >
                    Xử lý phạt trễ & Giải phóng phòng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NÚT THAO TÁC CHECK-IN VÀ CHECK-OUT */}
          <div className="flex flex-wrap gap-3 mt-4 pt-2 border-t border-slate-200/60">
            <button 
              onClick={() => onCheckIn(booking.id)}
              disabled={!canCheckIn}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition ${
                canCheckIn 
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white cursor-pointer ring-2 ring-sky-300 shadow-md' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Xác nhận đã mượn phòng {checkInMsg}</span>
            </button>

            <button 
              onClick={() => onCheckOut(booking.id)}
              disabled={!canCheckOut}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition ${
                canCheckOut 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white cursor-pointer ring-2 ring-emerald-300 shadow-md' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <DoorClosed className="w-4 h-4" />
              <span>Xác nhận trả phòng {checkOutMsg}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
