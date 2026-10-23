import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, Lock, Unlock, Users, Calendar, 
  Clock, Search, CheckCircle, AlertTriangle, RefreshCw, 
  Trash2, Plus, ArrowLeft, Building2, UserCog, UserCheck, AlertOctagon,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export default function DevPage({ currentUser, simulatedTime }) {
  const navigate = useNavigate();

  // 1. Kiểm tra quyền Admin: Nếu không phải admin thì chặn truy cập
  const isAdmin = currentUser && currentUser.role === 'admin';

  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'users' | 'locks'
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ==================== TAB 1: TIMELINE LỊCH PHÒNG & SINH VIÊN ====================
  const [matrixDate, setMatrixDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [scheduleMatrix, setScheduleMatrix] = useState([]);
  const [timelineSearch, setTimelineSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);

  const loadMatrix = async (d) => {
    try {
      setLoading(true);
      const data = await api.getAdminScheduleMatrix(d);
      setScheduleMatrix(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadMatrix(matrixDate);
    }
  }, [matrixDate, isAdmin]);

  // Sinh danh sách ngày (từ 14 ngày trước đến 28 ngày tới)
  const availableDates = useMemo(() => {
    const dates = [];
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (let i = -14; i <= 28; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayName = days[d.getDay()];
      dates.push({
        iso,
        label: iso === todayIso ? `${dayName}, ${d.getDate()}/${d.getMonth() + 1} (Hôm nay)` : `${dayName}, ${d.getDate()}/${d.getMonth() + 1}`
      });
    }

    if (!dates.some(d => d.iso === matrixDate)) {
      const md = new Date(matrixDate + 'T00:00:00');
      const dayName = days[md.getDay()];
      dates.push({
        iso: matrixDate,
        label: `${dayName}, ${md.getDate()}/${md.getMonth() + 1}`
      });
      dates.sort((a, b) => a.iso.localeCompare(b.iso));
    }

    return dates;
  }, [matrixDate]);

  const filteredMatrix = useMemo(() => {
    return scheduleMatrix.filter(room => {
      const matchSearch = room.roomId.toLowerCase().includes(timelineSearch.trim().toLowerCase()) ||
                          room.name.toLowerCase().includes(timelineSearch.trim().toLowerCase());
      const matchBuilding = selectedBuilding === 'ALL' || room.building === selectedBuilding;
      return matchSearch && matchBuilding;
    });
  }, [scheduleMatrix, timelineSearch, selectedBuilding]);

  // ==================== TAB 2: QUẢN LÝ TÀI KHOẢN & GỠ BAN ====================
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminUsers();
      setUsersList(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, isAdmin]);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const q = userSearch.toLowerCase().trim();
      const matchQ = (u.studentId || '').toLowerCase().includes(q) ||
                     (u.fullName || '').toLowerCase().includes(q) ||
                     (u.email || '').toLowerCase().includes(q);
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchQ && matchRole;
    });
  }, [usersList, userSearch, roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Bạn có chắc muốn đổi quyền của tài khoản này thành ${newRole.toUpperCase()}?`)) return;
    try {
      const res = await api.updateUserRole(userId, newRole);
      showToast(res.message, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUnban = async (studentId) => {
    if (!window.confirm(`Xác nhận gỡ ban và phục hồi quyền mượn phòng cho sinh viên ${studentId}?`)) return;
    try {
      const res = await api.unbanStudent(studentId);
      showToast(res.message, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==================== TAB 3: KHÓA PHÒNG ====================
  const [locksList, setLocksList] = useState([]);
  const [newLock, setNewLock] = useState({
    roomId: '',
    lockType: 'PERMANENT',
    date: matrixDate,
    startTime: '08:00',
    endTime: '12:00',
    reason: 'Bảo trì trang thiết bị'
  });

  const loadLocks = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminLocks();
      setLocksList(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'locks') {
      loadLocks();
    }
  }, [activeTab, isAdmin]);

  const handleCreateLock = async (e) => {
    e.preventDefault();
    if (!newLock.roomId) {
      showToast('Vui lòng chọn phòng cần khóa!', 'error');
      return;
    }
    try {
      const res = await api.createRoomLock({
        ...newLock,
        lockedBy: currentUser?.studentId || 'Admin'
      });
      showToast(res.message, 'success');
      setNewLock(prev => ({ ...prev, roomId: '' }));
      loadLocks();
      loadMatrix(matrixDate);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteLock = async (lockId) => {
    if (!window.confirm('Bạn có chắc muốn mở khóa cho phòng này?')) return;
    try {
      const res = await api.deleteRoomLock(lockId);
      showToast(res.message, 'success');
      loadLocks();
      loadMatrix(matrixDate);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Helpers tính toán tọa độ trục thời gian (08:00 - 17:00, 540 phút)
  const DAY_START = 8 * 60;
  const TOTAL_DAY = 9 * 60;
  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getSlotStyle = (start, end) => {
    const sMins = Math.max(DAY_START, toMinutes(start));
    const eMins = Math.min(DAY_START + TOTAL_DAY, toMinutes(end));
    const leftPercent = ((sMins - DAY_START) / TOTAL_DAY) * 100;
    const widthPercent = Math.max(2, ((eMins - sMins) / TOTAL_DAY) * 100);
    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`
    };
  };

  // Ref container ma trận timeline
  const timelineScrollRef = useRef(null);

  // Điều khiển chuyển ngày qua lại (< và >)
  const handlePrevDay = () => {
    const cur = new Date(matrixDate + 'T00:00:00');
    cur.setDate(cur.getDate() - 1);
    const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    setMatrixDate(iso);
  };

  const handleNextDay = () => {
    const cur = new Date(matrixDate + 'T00:00:00');
    cur.setDate(cur.getDate() + 1);
    const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    setMatrixDate(iso);
  };

  const handleToday = () => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setMatrixDate(iso);
  };

  // Nếu không phải admin, render cảnh báo không có quyền
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-lg border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Khu vực Giới hạn</h2>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          Trang <strong>/devpage</strong> chỉ dành riêng cho tài khoản có quyền <strong>Quản trị viên (Admin)</strong>. Bạn đang đăng nhập với quyền Sinh viên hoặc chưa đăng nhập.
        </p>
        <button
          onClick={() => navigate('/homepage')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow hover:bg-slate-800 transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* TOAST THÔNG BÁO */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl font-semibold text-white transition-all animate-in fade-in slide-in-from-top-3 ${
          toast.type === 'error' ? 'bg-rose-600 shadow-rose-600/30' : 'bg-emerald-600 shadow-emerald-600/30'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* HEADER QUẢN TRỊ VIÊN */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            HCMIU Smart Campus • Admin Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Trang Quản Trị Hệ Thống <span className="text-purple-400">(/devpage)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Quản lý lịch phòng chi tiết, phân quyền tài khoản, gỡ phạt sinh viên và thiết lập khóa phòng bảo trì.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-300">{currentUser?.fullName}</div>
            <div className="text-[11px] text-purple-400 font-mono font-semibold">
              Admin • {currentUser?.studentId}
            </div>
          </div>
          <button
            onClick={() => navigate('/homepage')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Trang chủ
          </button>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch Phòng & Sinh Viên</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tài Khoản & Cấp Quyền & Gỡ Ban</span>
        </button>

        <button
          onClick={() => setActiveTab('locks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'locks'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Khóa / Mở Khóa Phòng</span>
        </button>
      </div>

      {/* ==================== TAB 1: BẢNG LỊCH PHÒNG & SINH VIÊN ==================== */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          {/* BỘ LỌC NGÀY & TÒA NHÀ & TÌM KIẾM */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              {/* Chọn Ngày kèm 2 nút < và > */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-0.5">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-purple-700 transition cursor-pointer active:scale-90"
                  title="Về ngày trước đó"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 px-2">
                  <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                  <select
                    value={matrixDate}
                    onChange={(e) => setMatrixDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {availableDates.map(d => (
                      <option key={d.iso} value={d.iso}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleNextDay}
                  className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-purple-700 transition cursor-pointer active:scale-90"
                  title="Qua ngày tiếp theo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Lọc Tòa nhà */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                {['ALL', 'A1', 'A2', 'LA1', 'LA2', 'B'].map(b => (
                  <button
                    key={b}
                    onClick={() => setSelectedBuilding(b)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedBuilding === b 
                        ? 'bg-white text-purple-700 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {b === 'ALL' ? 'Tất cả tòa' : b}
                  </button>
                ))}
              </div>
            </div>

            {/* Tìm kiếm phòng */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Tìm mã phòng (VD: A1.101)..."
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* CHÚ THÍCH TRẠNG THÁI & ĐIỀU HƯỚNG NHANH */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium text-slate-500 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-sky-500 shrink-0"></span>
                <span>Đã đặt (BOOKED)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0"></span>
                <span>Đang sử dụng (CHECKED_IN)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-500 shrink-0"></span>
                <span>Đã hoàn tất (COMPLETED)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-500 border border-amber-600 shrink-0"></span>
                <span>🔒 Phòng bị khóa / Bảo trì</span>
              </div>
            </div>

            {/* ĐIỀU HƯỚNG CHUYỂN NGÀY BẰNG 2 NÚT < VÀ > */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePrevDay}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-purple-50 hover:text-purple-700 text-slate-700 border border-slate-200 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Về ngày trước đó"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Ngày trước</span>
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Về ngày hôm nay"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={handleNextDay}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-purple-50 hover:text-purple-700 text-slate-700 border border-slate-200 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Qua ngày tiếp theo"
              >
                <span>Ngày sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* BẢNG TIMELINE MA TRẬN PHÒNG (CUỘN NGANG & DỌC MƯỢT MÀ TRÊN 1 CONTAINER DUY NHẤT) */}
          <div 
            ref={timelineScrollRef}
            className="border border-slate-200 rounded-2xl overflow-auto max-h-[600px] bg-white shadow-xs relative select-none"
          >
            <div className="min-w-[1200px]">
              {/* TRỤC THỜI GIAN HEADER (08:00 - 17:00) */}
              <div className="flex items-center bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 sticky top-0 z-30 shadow-2xs">
                <div className="w-52 px-3.5 py-3 shrink-0 border-r border-slate-200 bg-slate-100 sticky top-0 left-0 z-40 shadow-xs flex items-center justify-between">
                  <span>Phòng ({filteredMatrix.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Cuộn ngang 👉</span>
                </div>
                <div className="flex-1 relative h-10 flex items-center">
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === 9;
                    return (
                      <div
                        key={time}
                        className={`absolute text-[10px] font-mono flex flex-col pointer-events-none ${
                          isFirst
                            ? 'left-0 items-start translate-x-0 ps-1.5'
                            : isLast
                            ? 'left-full -translate-x-full items-end pe-1.5'
                            : 'items-center -translate-x-1/2'
                        }`}
                        style={!isFirst && !isLast ? { left: `${(idx / 9) * 100}%` } : undefined}
                      >
                        <span className="font-bold text-slate-800">{time}</span>
                        <span className="w-px h-1.5 bg-slate-400 mt-0.5"></span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DANH SÁCH CÁC DÒNG PHÒNG */}
              <div className="divide-y divide-slate-100">
                {filteredMatrix.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Không tìm thấy phòng nào phù hợp!
                  </div>
                ) : (
                  filteredMatrix.map(room => (
                    <div key={room.id} className="flex items-center hover:bg-slate-50/70 transition group">
                      {/* Cột thông tin phòng - STICKY LEFT CỐ ĐỊNH KHI LƯỚT NGANG */}
                      <div className="w-52 px-3.5 py-2.5 shrink-0 border-r border-slate-200 bg-white group-hover:bg-slate-50 sticky left-0 z-20 shadow-xs transition">
                        <div className="font-mono font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{room.id}</span>
                          {room.isPermanentlyLocked && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-md">
                              Khóa
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {room.category} • {room.capacity} chỗ
                        </div>
                      </div>

                      {/* Cột Timeline Bar */}
                      <div className="flex-1 relative h-11 bg-slate-50/40">
                        {/* Vạch kẻ trục 1 tiếng */}
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 w-px bg-slate-200/50 pointer-events-none"
                            style={{ left: `${(i / 9) * 100}%` }}
                          ></div>
                        ))}

                        {/* Khóa Vô thời hạn (chiếm trọn dòng) */}
                        {room.isPermanentlyLocked && (
                          <div 
                            className="absolute inset-y-1.5 inset-x-1 bg-amber-500/20 border border-amber-400 rounded-lg flex items-center px-3 gap-1.5 text-amber-900 text-xs font-bold shadow-2xs select-none"
                            title="Phòng đang bị khóa vô thời hạn bởi Admin"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">🔒 Khóa vô thời hạn: {room.locks?.[0]?.reason || 'Bảo trì'}</span>
                          </div>
                        )}

                        {/* Khóa theo khung giờ (TIME_SLOT) */}
                        {!room.isPermanentlyLocked && room.locks?.filter(l => l.lockType === 'TIME_SLOT').map(lock => {
                          const style = getSlotStyle(lock.startTime, lock.endTime);
                          return (
                            <div
                              key={lock.id}
                              style={style}
                              className="absolute top-1.5 bottom-1.5 bg-amber-500/30 border border-amber-500 rounded-lg flex items-center justify-center text-[10px] font-bold text-amber-900 overflow-hidden px-1 shadow-2xs z-10"
                              title={`🔒 KHÓA KHUNG GIỜ: ${lock.startTime} - ${lock.endTime} (${lock.reason})`}
                            >
                              <span className="truncate flex items-center gap-1">
                                <Lock className="w-3 h-3 shrink-0" />
                                {lock.startTime}-{lock.endTime} ({lock.reason})
                              </span>
                            </div>
                          );
                        })}

                        {/* Khối đơn đặt phòng của sinh viên */}
                        {!room.isPermanentlyLocked && room.bookings?.map(b => {
                          const style = getSlotStyle(b.startTime, b.endTime);
                          const isCheckedIn = b.status === 'CHECKED_IN';
                          const isCompleted = b.status === 'COMPLETED';

                          return (
                            <div
                              key={b.id}
                              style={style}
                              onClick={() => setSelectedBookingDetail({ ...b, room })}
                              className={`absolute top-1.5 bottom-1.5 rounded-lg px-2 flex items-center justify-between text-white text-[10px] font-semibold cursor-pointer shadow-xs hover:ring-2 hover:ring-offset-1 hover:ring-purple-500 transition z-20 ${
                                isCheckedIn ? 'bg-gradient-to-r from-emerald-600 to-teal-600' :
                                isCompleted ? 'bg-gradient-to-r from-purple-600 to-indigo-600' :
                                'bg-gradient-to-r from-sky-600 to-blue-700'
                              }`}
                              title={`Click xem chi tiết: ${b.studentId} (${b.fullName || b.studentEmail})`}
                            >
                              <span className="truncate font-mono">
                                {b.startTime}-{b.endTime} | {b.studentId}
                              </span>
                              <span className="text-[9px] uppercase font-bold opacity-85 ml-1 hidden sm:inline">
                                {b.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* MODAL CHI TIẾT ĐƠN ĐẶT PHÒNG KHI ADMIN CLICK VÀO BLOCK */}
          {selectedBookingDetail && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Chi tiết ca mượn phòng</h4>
                      <p className="text-[11px] text-slate-500 font-mono">Mã đơn: {selectedBookingDetail.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBookingDetail(null)}
                    className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="py-4 space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Phòng học:</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedBookingDetail.roomId}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Khung giờ mượn:</span>
                    <span className="font-bold text-purple-700 font-mono">
                      {selectedBookingDetail.startTime} - {selectedBookingDetail.endTime} (Ngày {matrixDate})
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Sinh viên đặt:</span>
                    <span className="font-bold text-slate-900">
                      {selectedBookingDetail.fullName || 'Chưa cập nhật tên'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Mã số sinh viên (MSSV):</span>
                    <span className="font-bold font-mono text-sky-700">{selectedBookingDetail.studentId}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Email sinh viên:</span>
                    <span className="font-mono text-slate-800">{selectedBookingDetail.studentEmail}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Quy mô nhóm:</span>
                    <span className="font-bold text-slate-800">{selectedBookingDetail.memberCount || 1} người</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500 font-medium">Trạng thái:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      selectedBookingDetail.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' :
                      selectedBookingDetail.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                      'bg-sky-100 text-sky-800'
                    }`}>
                      {selectedBookingDetail.status === 'CHECKED_IN' ? 'Đang sử dụng phòng' :
                       selectedBookingDetail.status === 'COMPLETED' ? 'Đã hoàn tất trả phòng' :
                       'Đã đặt trước'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setSelectedBookingDetail(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: QUẢN LÝ TÀI KHOẢN & GỠ BAN ==================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Danh sách Tài khoản & Phân quyền</h3>
              <p className="text-xs text-slate-500">Cấp quyền Quản trị viên (Admin) hoặc Sinh viên (Student), gỡ lệnh cấm vi phạm.</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Lọc theo Role */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                {['ALL', 'admin', 'student'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      roleFilter === r ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r === 'ALL' ? 'Tất cả' : r.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Tìm kiếm người dùng */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Tìm MSSV, tên, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                onClick={loadUsers}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                title="Tải lại danh sách"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BẢNG NGƯỜI DÙNG */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Sinh viên</th>
                  <th className="py-3 px-4">Email trường HCMIU</th>
                  <th className="py-3 px-4">Quyền hạn (Role)</th>
                  <th className="py-3 px-4">Trạng thái Chế tài</th>
                  <th className="py-3 px-4">Vi phạm (No-Show / Trễ)</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                      Không tìm thấy tài khoản nào!
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      {/* Cột Tên & MSSV */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-purple-700 font-bold">{u.studentId}</div>
                      </td>

                      {/* Cột Email */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {u.email}
                      </td>

                      {/* Cột Role (Có dropdown đổi quyền) */}
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role || 'student'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-sky-50 text-sky-800 border-sky-200'
                          }`}
                        >
                          <option value="student">Student (Sinh viên)</option>
                          <option value="admin">Admin (Quản trị viên)</option>
                        </select>
                      </td>

                      {/* Cột Trạng thái Chế tài */}
                      <td className="py-3.5 px-4">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertOctagon className="w-3 h-3 text-rose-600" />
                            {u.banStatusText}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Bình thường
                          </span>
                        )}
                      </td>

                      {/* Cột Vi phạm */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>No-show: <strong className="text-slate-900">{u.penalties?.noShowCount || 0}</strong></div>
                        <div>Trả trễ: <strong className="text-slate-900">{u.penalties?.lateCheckoutCount || 0}</strong></div>
                      </td>

                      {/* Cột Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        {u.isBanned ? (
                          <button
                            onClick={() => handleUnban(u.studentId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Gỡ ban
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Không bị ban</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: KHÓA / MỞ KHÓA PHÒNG ==================== */}
      {activeTab === 'locks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* CỘT TRÁI: FORM TẠO LỆNH KHÓA PHÒNG */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5 lg:col-span-1">
            <div className="flex items-center gap-2 text-amber-700 font-bold pb-3 border-b border-slate-100">
              <Lock className="w-5 h-5" />
              <span>Thiết lập Khóa phòng</span>
            </div>

            <form onSubmit={handleCreateLock} className="space-y-4 text-xs">
              {/* Chọn phòng */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã phòng cần khóa:</label>
                <input
                  type="text"
                  placeholder="Nhập mã phòng (VD: A1.101, B.202)..."
                  value={newLock.roomId}
                  onChange={(e) => setNewLock(prev => ({ ...prev, roomId: e.target.value.toUpperCase() }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                />
              </div>

              {/* Loại khóa */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Hình thức khóa:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewLock(prev => ({ ...prev, lockType: 'PERMANENT' }))}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                      newLock.lockType === 'PERMANENT'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Vô thời hạn
                    <span className="block text-[10px] font-normal opacity-85 mt-0.5">Cho tới khi mở lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewLock(prev => ({ ...prev, lockType: 'TIME_SLOT' }))}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                      newLock.lockType === 'TIME_SLOT'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Theo khung giờ
                    <span className="block text-[10px] font-normal opacity-85 mt-0.5">Theo ngày & giờ</span>
                  </button>
                </div>
              </div>

              {/* Khung giờ (nếu chọn TIME_SLOT) */}
              {newLock.lockType === 'TIME_SLOT' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Ngày khóa:</label>
                    <input
                      type="date"
                      value={newLock.date}
                      onChange={(e) => setNewLock(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-amber-900 mb-1">Giờ bắt đầu:</label>
                      <input
                        type="time"
                        value={newLock.startTime}
                        onChange={(e) => setNewLock(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-xl font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-amber-900 mb-1">Giờ kết thúc:</label>
                      <input
                        type="time"
                        value={newLock.endTime}
                        onChange={(e) => setNewLock(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-xl font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lý do khóa */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý do khóa phòng:</label>
                <input
                  type="text"
                  placeholder="VD: Bảo trì máy chiếu, Sửa điều hòa..."
                  value={newLock.reason}
                  onChange={(e) => setNewLock(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Áp dụng Khóa phòng
              </button>
            </form>
          </div>

          {/* CỘT PHẢI: DANH SÁCH CÁC PHÒNG ĐANG BỊ KHÓA */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-slate-900 text-base">Danh sách Phòng đang bị khóa ({locksList.length})</h3>
              </div>
              <button
                onClick={loadLocks}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                title="Tải lại danh sách"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {locksList.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                Hiện tại không có phòng nào bị khóa! Tất cả các phòng đều sẵn sàng cho sinh viên mượn.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
                {locksList.map(lock => (
                  <div
                    key={lock.id}
                    className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-black text-sm text-slate-900">{lock.roomId}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          lock.lockType === 'PERMANENT' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {lock.lockType === 'PERMANENT' ? 'Khóa vô thời hạn' : 'Khóa theo ca'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{lock.reason}</p>
                      {lock.lockType === 'TIME_SLOT' && (
                        <p className="text-[11px] font-mono font-bold text-amber-900 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {lock.date}: {lock.startTime} - {lock.endTime}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2">
                        Khóa bởi: {lock.lockedBy} • {new Date(lock.lockedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteLock(lock.id)}
                      className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Mở khóa phòng ngay
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
