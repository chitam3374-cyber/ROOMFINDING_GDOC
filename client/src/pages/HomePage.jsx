import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, ArrowRight, ShieldAlert, CheckCircle, Ban, AlertTriangle, Sparkles, LogIn, UserPlus, Clock, MessageSquareQuote, Star, Heart, BadgeCheck, Quote } from 'lucide-react';
import RoomCard from '../components/RoomCard';
import BookingBanner from '../components/BookingBanner';

const celebrityComments = [
  {
    id: 1,
    name: 'Elon Musk',
    handle: '@elonmusk',
    role: 'CEO Tesla & SpaceX • Chủ sở hữu X',
    avatar: '/avatars/elon_musk.png',
    content: 'Tôi đã tạo ra xe bay rồi, nhưng chưa thấy ai tạo ra web đặt phòng "bay" như web IU RoomPeek!',
    likes: '420K',
    time: '15 phút trước'
  },
  {
    id: 2,
    name: 'Mr.Beast',
    handle: '@mrbeast',
    role: 'Top 1 Creator Thế giới • 350M+ Subs',
    avatar: '/avatars/mr_beast.jpg',
    content: 'Nếu tôi có tổ chức cuộc thi thiết kế web đặt phòng, chắc chắn giải thưởng 1 triệu dollar sẽ thuộc về IU RoomPeek.',
    likes: '1.2M',
    time: '1 giờ trước'
  },
  {
    id: 3,
    name: 'Sơn Tùng M-TP',
    handle: '@sontungmtp',
    role: 'Chủ tịch M-TP Entertainment • Ca sĩ',
    avatar: '/avatars/son_tung.png',
    content: 'Flop quá thì ghi tên anh vào.',
    likes: '777K',
    time: '2 giờ trước'
  },
  {
    id: 4,
    name: 'Mark Zuckerberg',
    handle: '@zuck',
    role: 'Nhà sáng lập & CEO Meta',
    avatar: '/avatars/mark_zuckerberg.png',
    content: 'Công nhận anh chị trong Google Developer Groups on Campus đẹp trai xinh gái thật!',
    likes: '350K',
    time: '3 giờ trước'
  },
  {
    id: 5,
    name: 'Bill Gates',
    handle: '@BillGates',
    role: 'Đồng sáng lập Microsoft',
    avatar: '/avatars/bill_gates.jpg',
    content: 'Windows có thể cập nhật liên tục, nhưng sự mượt mà của IU RoomPeek thì không cần chỉnh sửa thêm gì nữa — quá hoàn hảo!',
    likes: '512K',
    time: '5 giờ trước'
  },
  {
    id: 6,
    name: 'Steve Jobs',
    handle: '@stevejobs',
    role: 'Huyền thoại sáng lập Apple',
    avatar: '/avatars/steve_jobs.png',
    content: 'Thật không thể, khổng thể tin nổi!',
    likes: '999K',
    time: 'Hôm qua'
  },
  {
    id: 7,
    name: 'Cristiano Ronaldo',
    handle: '@cristiano',
    role: 'Huyền thoại bóng đá thế giới • 5 Quả bóng vàng',
    avatar: '/avatars/ronaldo.png',
    content: 'Siuuuu! Tốc độ đặt phòng ở IU RoomPeek còn nhanh hơn cả những pha bứt tốc của tôi ở đỉnh cao phong độ!',
    likes: '888K',
    time: 'Hôm qua'
  }
];

export default function HomePage({
  studentInput, setStudentInput,
  memberCount, setMemberCount,
  studentStatus, handleStudentAction,
  marqueeRooms, onOpenBookModal,
  onCheckIn, onCheckOut, onCancelBooking,
  onTimeoutNoShow, onTimeoutLateCheckOut,
  simulatedTime,
  currentUser,
  onOpenAuth,
  onLogout
}) {
  // Đồng hồ thời gian thực tế / thời gian giả lập DevMode
  const [clockDate, setClockDate] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setClockDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Lấy thứ trong tuần và ngày tháng theo format giao diện điện thoại (VD: Thứ Sáu, 23 tháng 10)
  const phoneDateFormatted = useMemo(() => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const d = clockDate;
    const dayOfWeek = days[d.getDay()];
    const day = d.getDate();
    const month = d.getMonth() + 1;
    return `${dayOfWeek}, ${day} tháng ${month}`;
  }, [clockDate]);

  // Giờ và phút dạng 00:00 và giây dạng :00
  const { phoneTimeHM, phoneTimeS } = useMemo(() => {
    let h, m, s;
    if (simulatedTime) {
      const parts = simulatedTime.split(':').map(Number);
      h = String(parts[0] || 0).padStart(2, '0');
      m = String(parts[1] || 0).padStart(2, '0');
      s = String(parts[2] || 0).padStart(2, '0');
    } else {
      h = String(clockDate.getHours()).padStart(2, '0');
      m = String(clockDate.getMinutes()).padStart(2, '0');
      s = String(clockDate.getSeconds()).padStart(2, '0');
    }
    return {
      phoneTimeHM: `${h}:${m}`,
      phoneTimeS: s
    };
  }, [clockDate, simulatedTime]);

  // Quản lý băng chuyền phòng nhanh mượt mà qua RAF (RequestAnimationFrame)
  const trackRef = useRef(null);
  const posRef = useRef(0);
  const singleWidthRef = useRef(0);
  const isPausedRef = useRef(false);
  const hasCenteredRef = useRef(false);
  const mainRafRef = useRef(null);
  const slideRafRef = useRef(null);
  const lastTimeRef = useRef(performance.now());

  // Đảm bảo đủ danh sách lặp (3 bộ) để chạy vô tận không bị hở mép
  const displayMarqueeRooms = useMemo(() => {
    if (!marqueeRooms || marqueeRooms.length === 0) return [];
    let list = marqueeRooms;
    while (list.length < 8) {
      list = [...list, ...marqueeRooms];
    }
    return [...list, ...list, ...list];
  }, [marqueeRooms]);

  useEffect(() => {
    if (!displayMarqueeRooms || displayMarqueeRooms.length === 0) return;

    // Chiều dài 1 bộ phòng (288px width + 16px gap = 304px mỗi phòng)
    const singleWidth = (displayMarqueeRooms.length / 3) * 304;
    singleWidthRef.current = singleWidth;

    // Đặt vị trí bắt đầu tại bộ thứ 2 (-singleWidth) để 2 bên trái phải luôn có sẵn thẻ
    if (posRef.current === 0) {
      posRef.current = -singleWidth;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
      }
    }

    const speed = 40; // pixel/giây - trượt đều êm dịu
    lastTimeRef.current = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // Khi không tạm dừng và không đang trượt căn giữa
      if (!isPausedRef.current && !slideRafRef.current) {
        posRef.current -= speed * dt;

        // Vòng lặp vô tận: khi đi hết bộ 2 sang bộ 3, dịch lại đúng 1 chu kỳ (-singleWidth)
        if (posRef.current <= -2 * singleWidthRef.current) {
          posRef.current += singleWidthRef.current;
        } else if (posRef.current > -singleWidthRef.current * 0.2) {
          posRef.current -= singleWidthRef.current;
        }

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
        }
      }

      mainRafRef.current = requestAnimationFrame(loop);
    };

    mainRafRef.current = requestAnimationFrame(loop);

    return () => {
      if (mainRafRef.current) cancelAnimationFrame(mainRafRef.current);
      if (slideRafRef.current) cancelAnimationFrame(slideRafRef.current);
    };
  }, [displayMarqueeRooms]);

  const handleCardMouseEnter = (e) => {
    // Tạm dừng chạy ngay lập tức
    isPausedRef.current = true;

    // CHỈ căn giữa vào lần hover đầu tiên vào card
    if (!hasCenteredRef.current) {
      hasCenteredRef.current = true;

      const cardRect = e.currentTarget.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const mouseX = e.clientX;
      const deltaX = mouseX - cardCenterX;

      if (slideRafRef.current) {
        cancelAnimationFrame(slideRafRef.current);
        slideRafRef.current = null;
      }

      const startPos = posRef.current;
      const targetPos = startPos + deltaX;
      const startTime = performance.now();
      const duration = 380; // ms

      const animateSlide = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing mượt mà: easeOutCubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentPos = startPos + (targetPos - startPos) * ease;

        posRef.current = currentPos;
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${currentPos}px, 0, 0)`;
        }

        if (progress < 1) {
          slideRafRef.current = requestAnimationFrame(animateSlide);
        } else {
          slideRafRef.current = null;
        }
      };

      slideRafRef.current = requestAnimationFrame(animateSlide);
    }
  };

  const handleMarqueeContainerMouseLeave = () => {
    // Khi rời chuột: cho chạy tiếp từ ĐÚNG VỊ TRÍ ĐANG ĐỨNG, không nhảy hay reset về vị trí cũ!
    hasCenteredRef.current = false;
    if (slideRafRef.current) {
      cancelAnimationFrame(slideRafRef.current);
      slideRafRef.current = null;
    }
    isPausedRef.current = false;
    lastTimeRef.current = performance.now();
  };

  return (
    <div className="space-y-12">
      {/* KHU VỰC HERO CÓ HÌNH NỀN TRƯỜNG & KHUNG KÍNH TRONG SUỐT */}
      <div 
        className="relative rounded-3xl overflow-hidden p-6 sm:p-12 mb-10 bg-cover bg-center shadow-lg border border-slate-200"
        style={{ backgroundImage: `url('/campus.jpg')` }}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          
          {/* ĐỒNG HỒ PHONG CÁCH ĐIỆN THOẠI (CENTER HORIZONTAL, KHÔNG CÓ BACKGROUND, GIỜ + NGÀY) */}
          <div className="text-center mb-8 sm:mb-10 select-none flex flex-col items-center justify-center">
            {/* Giờ to dạng 00:00 (với giây tinh tế phong cách lockscreen điện thoại) */}
            <div className="flex items-baseline justify-center tracking-tight text-white drop-shadow-lg">
              <span className="text-6xl sm:text-7xl md:text-8xl font-extralight tracking-tight font-sans">
                {phoneTimeHM}
              </span>
              <span className="text-2xl sm:text-3xl font-light text-sky-200/90 ml-1.5 drop-shadow">
                :{phoneTimeS}
              </span>
            </div>

            {/* Thứ, Ngày Tháng kiểu điện thoại */}
            <p className="text-sm sm:text-base md:text-lg font-medium text-slate-100/95 tracking-wide mt-1 drop-shadow">
              {phoneDateFormatted}
            </p>

            {/* Tag chế độ Dev nếu đang bật */}
            {simulatedTime && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/40 text-xs font-semibold backdrop-blur-xs drop-shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>⚡ Dev Mode: Giờ đang chạy ({phoneTimeHM}:{phoneTimeS})</span>
              </div>
            )}
          </div>

          {/* LƯỚI BỐ CỤC CHÍNH BÊN DƯỚI: CỘT TRÁI (THÔNG TIN) & CỘT PHẢI (LỊCH SỬ PHẠT) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
            
            {/* CỘT TRÁI: FORM TRA CỨU DẠNG KÍNH MỜ TRONG SUỐT (GLASSMORPHISM) */}
            <div className={`${currentUser && studentStatus ? 'lg:col-span-2' : 'lg:col-span-3 max-w-xl mx-auto w-full'} bg-white/85 backdrop-blur-md border border-white/60 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all`}>
              
              {!currentUser ? (
              /* TRƯỜNG HỢP CHƯA ĐĂNG NHẬP */
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/90 text-sky-800 text-xs font-bold border border-sky-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Hệ thống Mượn phòng Sinh viên HCMIU
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Chào mừng đến với <span className="bg-gradient-to-r from-sky-600 to-indigo-700 bg-clip-text text-transparent">IU RoomPeek</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Hệ thống đặt phòng học nhóm & phòng thực hành thông minh. Vui lòng đăng nhập bằng <strong>Email sinh viên trường ĐH Quốc Tế (@student.hcmiu.edu.vn)</strong> để tiếp tục.
                </p>

                <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                  <button 
                    onClick={() => onOpenAuth('login')}
                    className="flex-1 py-3 px-5 bg-gradient-to-r from-sky-600 to-indigo-900 hover:from-sky-500 hover:to-indigo-950 text-white font-bold rounded-2xl shadow-lg shadow-sky-900/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <LogIn className="w-4 h-4" />
                    Đăng nhập ngay
                  </button>
                  <button 
                    onClick={() => onOpenAuth('register')}
                    className="flex-1 py-3 px-5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <UserPlus className="w-4 h-4" />
                    Đăng ký tài khoản
                  </button>
                </div>
              </div>
            ) : (
              /* TRƯỜNG HỢP ĐÃ ĐĂNG NHẬP TÀI KHOẢN SINH VIÊN */
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white text-lg font-black shadow-md">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                        <span>{currentUser.fullName}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Sinh viên IU
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        MSSV: <strong className="text-sky-700 font-mono font-bold">{currentUser.studentId}</strong> • {currentUser.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                      Quy mô nhóm mượn phòng (Số lượng thành viên)
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="1"
                        max="50"
                        value={memberCount} 
                        onChange={(e) => setMemberCount(e.target.value)}
                        placeholder="VD: 3 hoặc 5 thành viên" 
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/90 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold shadow-inner transition"
                      />
                      <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button 
                    onClick={handleStudentAction}
                    className="w-full bg-gradient-to-r from-sky-600 to-indigo-900 hover:from-sky-500 hover:to-indigo-950 text-white font-bold py-3 rounded-2xl transition duration-200 shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-98"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {studentStatus?.hasActiveBooking ? 'XEM PHÒNG ĐANG MƯỢN' : 'TÌM PHÒNG & ĐẶT PHÒNG'}
                  </button>
                </div>

                {/* KHỐI HIỂN THỊ PHÒNG ĐANG ĐẶT & NÚT HỦY PHÒNG */}
                {studentStatus?.hasActiveBooking && (
                  <div className="mt-6 pt-5 border-t border-slate-200/80">
                    <BookingBanner 
                      booking={studentStatus?.booking}
                      onCheckIn={onCheckIn}
                      onCheckOut={onCheckOut}
                      onTimeoutNoShow={onTimeoutNoShow}
                      onTimeoutLateCheckOut={onTimeoutLateCheckOut}
                      simulatedTime={simulatedTime}
                    />

                    {/* Nút hủy phòng (chỉ xuất hiện khi ở trạng thái BOOKED, chưa Check-in) */}
                    {studentStatus.booking.status === 'BOOKED' && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => onCancelBooking(studentStatus.booking.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Hủy đặt phòng
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* CỘT PHẢI: LỊCH SỬ BỊ PHẠT CỦA SINH VIÊN (CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP) */}
          {currentUser && studentStatus && (
            <div className="bg-white/85 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-600 font-black mb-4">
                <ShieldAlert className="w-5 h-5" />
                <span className="tracking-tight">Lịch sử vi phạm & Chế tài</span>
              </div>

              {/* Thông báo đang bị tạm khóa đặt phòng (nếu có) */}
              {studentStatus.penalties && !studentStatus.penalties.canBook && (
                <div className="p-3 mb-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-bold shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>{studentStatus.penalties.reason}</div>
                </div>
              )}

              {!studentStatus.penalties?.violations?.length ? (
                <div className="text-center py-6 text-slate-500 text-sm font-medium">
                  <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                  Sinh viên chưa có vi phạm nào.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {studentStatus.penalties.violations.map((v, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/90 border border-rose-200/80 rounded-2xl text-xs text-rose-900 shadow-2xs">
                      <div className="font-bold">{v.reason}</div>
                      <div className="text-slate-500 mt-1 font-mono text-[11px]">{v.date}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1 font-medium">
                <p className="font-bold text-slate-800">Quy tắc chế tài:</p>
                <p>• Không nhận phòng (&gt;10p): Cảnh cáo → Khóa 30 ngày → Khóa vĩnh viễn.</p>
                <p>• Trả phòng: Cho phép trả phòng trong khung 30p trước và 30p sau giờ kết thúc ca. Quá 30p sau giờ kết thúc sẽ phạt: Cảnh cáo → Khóa 7 ngày → Khóa 30 ngày → Cấm vĩnh viễn.</p>
                <p>• Hủy phòng: Tối đa 3 lần miễn phí/ngày. Từ lần thứ 4 trở đi (cả hôm nay hoặc tương lai) sẽ hủy phòng và tạm cấm đặt 10 phút kèm cảnh cáo.</p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* MỤC "CHỌN PHÒNG NHANH" (BĂNG CHUYỀN) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            Chọn phòng nhanh
          </h3>
          <span className="text-xs text-emerald-800 bg-emerald-50 font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            Chỉ hiển thị {marqueeRooms.length} phòng đang TRỐNG
          </span>
        </div>

        <div 
          className="overflow-hidden relative w-full rounded-2xl pt-3 pb-8 -mb-6 px-1"
          onMouseLeave={handleMarqueeContainerMouseLeave}
        >
          <div 
            ref={trackRef}
            className="flex gap-4 w-max will-change-transform py-1"
          >
            {displayMarqueeRooms.map((room, idx) => (
              <div 
                key={`${room.id}-${idx}`}
                onMouseEnter={handleCardMouseEnter}
                className="w-72 flex-shrink-0"
              >
                <RoomCard 
                  room={room} 
                  onBook={onOpenBookModal} 
                  isMarquee={true} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MỤC "BÌNH LUẬN" */}
      <div className="space-y-4 pt-4 pb-8">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Bình luận
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            {celebrityComments.length} bình luận
          </span>
        </div>

        {/* DANH SÁCH BÌNH LUẬN THEO HÀNG DỌC */}
        <div className="flex flex-col space-y-3.5">
          {celebrityComments.map((c) => (
            <div 
              key={c.id}
              className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200 group flex items-start gap-3.5 sm:gap-4"
            >
              <img 
                src={c.avatar} 
                alt={c.name}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm group-hover:ring-sky-400 transition duration-300 shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                      {c.name}
                    </h4>
                    <BadgeCheck className="w-4 h-4 fill-sky-500 text-white shrink-0" />
                    <span className="text-[11px] font-medium text-slate-400 font-mono">
                      {c.handle}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
                    {c.time}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mt-1.5 pr-2">
                  “{c.content}”
                </p>
                <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-slate-100/80 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>{c.likes}</span>
                  </div>
                  <div className="flex text-amber-400 items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}