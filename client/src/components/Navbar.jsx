import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Home, DoorOpen, Wrench, Clock, Check, RotateCcw, Sparkles, LogIn, UserPlus, LogOut, User, ShieldCheck } from 'lucide-react';

export default function Navbar({ onOpenSchedule, devMode, setDevMode, activeBooking, currentUser, onOpenAuth, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/homepage' || location.pathname === '/';
  const isRoomsPage = location.pathname === '/rooms';
  const isDevPage = location.pathname === '/devpage';
  const isAdmin = currentUser && currentUser.role === 'admin';

  const [showDevMenu, setShowDevMenu] = useState(false);
  const menuRef = useRef(null);

  const getRealTimeNow = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const getRealTimeWithSeconds = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const toTimeStr = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Đóng menu dev khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDevMenu(false);
      }
    };
    if (showDevMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDevMenu]);

  // Tạo danh sách presets: Ưu tiên tự tính toán theo ca phòng đang mượn (nếu có)
  const presets = React.useMemo(() => {
    if (activeBooking && activeBooking.startTime && activeBooking.endTime) {
      const startMins = toMinutes(activeBooking.startTime);
      const endMins = toMinutes(activeBooking.endTime);

      return [
        { label: toTimeStr(startMins - 10), desc: 'Trước nhận 10p', time: toTimeStr(startMins - 10), tag: 'info' },
        { label: toTimeStr(startMins + 5), desc: 'Trong 10p nhận', time: toTimeStr(startMins + 5), tag: 'success' },
        { label: toTimeStr(startMins + 15), desc: '🚨 Quá 10p nhận', time: toTimeStr(startMins + 15), tag: 'danger' },
        { label: toTimeStr(endMins - 15), desc: 'Sớm 15p trả', time: toTimeStr(endMins - 15), tag: 'success' },
        { label: toTimeStr(endMins + 10), desc: 'Sau giờ 10p trả', time: toTimeStr(endMins + 10), tag: 'success' },
        { label: toTimeStr(endMins + 35), desc: '🚨 Quá 30p trả', time: toTimeStr(endMins + 35), tag: 'danger' },
      ];
    }

    return [
      { label: '09:00', desc: 'Sáng hợp lệ', time: '09:00' },
      { label: '08:55', desc: 'Trước 5p nhận', time: '08:55' },
      { label: '09:05', desc: 'Trong 10p nhận', time: '09:05' },
      { label: '09:15', desc: '🚨 Quá 10p nhận', time: '09:15' },
      { label: '10:45', desc: 'Sớm 15p trả', time: '10:45' },
      { label: '11:15', desc: 'Sau giờ 15p trả', time: '11:15' },
      { label: '11:35', desc: '🚨 Quá 30p trả', time: '11:35' },
      { label: '14:00', desc: 'Ca chiều', time: '14:00' },
    ];
  }, [activeBooking]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        
        {/* LOGO & BRAND NAME */}
        <div 
          onClick={() => navigate('/homepage')}
          className="flex items-center gap-3.5 cursor-pointer group select-none py-1"
        >
          <div className="relative flex items-center justify-center p-1.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200/60 shadow-xs group-hover:shadow transition duration-200">
            <img 
              src="/logo.png" 
              alt="Logo HCMIU" 
              className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
          </div>
          <div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1 leading-none">
              <span>IU</span>
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                RoomPeek
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Smart Campus Booking
            </p>
          </div>
        </div>

        {/* NAVIGATION CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nút Trang chủ */}
          <button 
            onClick={() => navigate('/homepage')} 
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              isHomePage 
                ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-200/80' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Home className={`w-4 h-4 ${isHomePage ? 'text-sky-600' : 'text-slate-500'}`} />
            <span>Trang chủ</span>
          </button>

          {/* Nút Phòng trống */}
          <button 
            onClick={() => navigate('/rooms')} 
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              isRoomsPage 
                ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-200/80' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <DoorOpen className={`w-4 h-4 ${isRoomsPage ? 'text-sky-600' : 'text-slate-500'}`} />
            <span>Phòng trống</span>
          </button>

          {/* Nút Devpage (Chỉ hiển thị cho Admin) */}
          {isAdmin && (
            <button 
              onClick={() => navigate('/devpage')} 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isDevPage 
                  ? 'bg-purple-600 text-white shadow-xs border border-purple-600' 
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Devpage</span>
            </button>
          )}

          {/* Vạch ngăn cách dọc */}
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Nút Lịch phòng tổng quát */}
          <button 
            onClick={onOpenSchedule}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-sky-100" />
            <span>Lịch phòng</span>
          </button>

          {/* DEV MODE BUTTON & POPOVER (CHỈ HIỂN THỊ VÀ CHO PHÉP TRUY CẬP BỞI ADMIN) */}
          {isAdmin && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowDevMenu(!showDevMenu)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                  devMode?.enabled
                    ? 'bg-amber-500/15 border-amber-400 text-amber-800 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-100/90 border-slate-200 text-slate-600 hover:bg-slate-200/70 hover:text-slate-800'
                }`}
                title="Chế độ nhà phát triển: Giả lập thời gian (Chỉ Admin)"
              >
                <Wrench className={`w-3.5 h-3.5 ${devMode?.enabled ? 'text-amber-600 animate-spin-slow' : 'text-slate-500'}`} />
                <span>
                  {devMode?.enabled ? `Dev: ${devMode.customTime}` : 'Dev Mode'}
                </span>
                {devMode?.enabled && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </button>

            {/* POPOVER MENU */}
            {showDevMenu && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-amber-100 text-amber-700">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">Dev Mode (Giả lập giờ)</h4>
                      <p className="text-[10px] text-slate-500">Bỏ qua giới hạn sau 17:00</p>
                    </div>
                  </div>

                  {/* Toggle On/Off */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!devMode?.enabled} 
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const nowTime = getRealTimeWithSeconds();
                        setDevMode(prev => ({
                          ...prev,
                          enabled: isChecked,
                          customTime: isChecked ? (prev.customTime || nowTime) : prev.customTime,
                          baseTime: isChecked ? (prev.customTime || nowTime) : prev.baseTime,
                          setAt: Date.now()
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {devMode?.enabled ? (
                  <div className="pt-3 space-y-3">
                    {/* Time Picker with Auto-fill real time */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Giờ giả lập đang test:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const nowTime = getRealTimeWithSeconds();
                            setDevMode(prev => ({
                              ...prev,
                              customTime: nowTime,
                              baseTime: nowTime,
                              setAt: Date.now()
                            }));
                          }}
                          className="text-[10px] text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded font-bold cursor-pointer transition shadow-2xs"
                          title="Lấy giờ hiện tại của máy tính tự điền vào đây"
                        >
                          🕒 Tự điền giờ thực ({getRealTimeNow()})
                        </button>
                      </div>
                      <input 
                        type="time" 
                        value={(devMode.customTime || getRealTimeNow()).slice(0, 5)}
                        onChange={(e) => {
                          const val = e.target.value;
                          const withSec = val.length === 5 ? `${val}:00` : val;
                          setDevMode(prev => ({
                            ...prev,
                            customTime: withSec,
                            baseTime: withSec,
                            setAt: Date.now()
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-sm font-mono font-bold text-slate-800 bg-amber-50/50 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-center"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 italic">
                        * Giờ giả lập sẽ tự động chạy tiếp từng giây như thời gian thực.
                      </p>
                    </div>

                    {/* Presets */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {activeBooking ? `Tự điền mốc giờ phòng ${activeBooking.roomId}:` : 'Khung giờ test nhanh:'}
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {presets.map((p) => (
                          <button
                            key={p.time}
                            type="button"
                            onClick={() => {
                              const withSec = p.time.length === 5 ? `${p.time}:00` : p.time;
                              setDevMode(prev => ({
                                ...prev,
                                customTime: withSec,
                                baseTime: withSec,
                                setAt: Date.now()
                              }));
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border text-left flex items-center justify-between transition cursor-pointer ${
                              (devMode.customTime || '').slice(0, 5) === p.time
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : p.tag === 'danger'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span className="font-mono font-bold">{p.time}</span>
                            <span className="text-[9px] opacity-85 truncate ml-1">{p.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Đồng bộ FE & BE
                      </span>
                      <button 
                        type="button"
                        onClick={() => setDevMode(prev => ({ ...prev, enabled: false }))}
                        className="text-slate-400 hover:text-slate-700 text-[10px] flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Về giờ thực
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 text-center py-2">
                    <p className="text-xs text-slate-500">
                      Đang chạy ở <strong>chế độ Thời gian thực</strong>.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Bật công tắc ở trên để chỉnh giờ tùy ý và test đặt phòng bất kỳ lúc nào.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* VẠCH NGĂN CÁCH TRƯỚC AUTH */}
          <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

          {/* KHU VỰC TÀI KHOẢN SINH VIÊN (AUTH) */}
          {!currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200/80 hover:bg-sky-100 transition duration-150 cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition duration-150 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng ký</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-gradient-to-r from-sky-50 to-indigo-50/60 border border-sky-200/80 rounded-2xl shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white text-xs font-black shadow-inner">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden md:block max-w-[140px]">
                  <div className="text-xs font-bold text-slate-800 truncate leading-tight flex items-center gap-1">
                    <span>{currentUser.fullName}</span>
                  </div>
                  <div className="text-[10px] font-mono text-sky-600 font-semibold truncate leading-tight flex items-center gap-1">
                    <span>{currentUser.studentId}</span>
                    {currentUser.role === 'admin' && (
                      <span className="text-[9px] bg-purple-100 text-purple-800 font-black px-1.5 py-0.2 rounded-md">
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Đăng xuất tài khoản"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition duration-150 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}