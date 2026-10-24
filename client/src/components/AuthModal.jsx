import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ShieldCheck, AlertCircle, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, initialTab = 'login', onSuccess }) {
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [loginData, setLoginData] = useState({
    emailOrStudentId: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setTab(initialTab);
    setError('');
    setSuccessMsg('');
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  // Xử lý tự động trích xuất MSSV khi nhập email
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setRegisterData(prev => {
      const next = { ...prev, email: val };
      if (!prev.studentId && val.includes('@')) {
        const prefix = val.split('@')[0].trim().toUpperCase();
        next.studentId = prefix;
      }
      return next;
    });
  };

  // Nút nhanh tự nối đuôi @student.hcmiu.edu.vn
  const handleAppendDomain = () => {
    setRegisterData(prev => {
      let base = prev.email.trim();
      if (base.includes('@')) {
        base = base.split('@')[0];
      }
      if (!base && prev.studentId) {
        base = prev.studentId.toLowerCase();
      }
      return {
        ...prev,
        email: base ? `${base}@student.hcmiu.edu.vn` : '@student.hcmiu.edu.vn'
      };
    });
  };

  // Submit Đăng nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const rawInput = loginData.emailOrStudentId.trim();
    if (!rawInput || !loginData.password) {
      setError('Vui lòng điền đầy đủ MSSV/Email và Mật khẩu!');
      return;
    }

    // Tự động thêm hậu tố @student.hcmiu.edu.vn nếu người dùng chỉ điền mỗi MSSV
    const emailToSubmit = rawInput.includes('@')
      ? rawInput.toLowerCase()
      : `${rawInput.toLowerCase()}@student.hcmiu.edu.vn`;

    setLoading(true);
    try {
      const res = await api.login({
        emailOrStudentId: emailToSubmit,
        password: loginData.password
      });

      setSuccessMsg(res.message || 'Đăng nhập thành công!');
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 600);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Submit Đăng ký
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = registerData.email.trim().toLowerCase();
    const cleanId = registerData.studentId.trim().toUpperCase();
    const cleanName = registerData.fullName.trim();

    if (!cleanName) {
      setError('Vui lòng nhập Họ và tên sinh viên!');
      return;
    }

    if (!cleanEmail.endsWith('@student.hcmiu.edu.vn')) {
      setError('Bắt buộc phải sử dụng email trường ĐH Quốc Tế (@student.hcmiu.edu.vn)!');
      return;
    }

    if (!cleanId) {
      setError('Vui lòng nhập Mã số sinh viên (MSSV)!');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Mật khẩu phải có độ dài từ 6 ký tự trở lên!');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        fullName: cleanName,
        studentId: cleanId,
        email: cleanEmail,
        password: registerData.password
      });

      setSuccessMsg('Đăng ký thành công! Đang tự động đăng nhập...');
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 800);
    } catch (err) {
      setError(err.message || 'Đăng ký tài khoản thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng modal: Hitbox vuông tròn chuẩn tâm 36x36px với hiệu ứng kính mờ */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/25 border border-white/20 transition-all duration-150 cursor-pointer shadow-xs active:scale-90"
        >
          <X className="w-5 h-5 shrink-0" />
        </button>

        {/* HEADER MODAL */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-white/15 to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center">
            <img src="/logo.png" alt="IU Logo" className="w-14 h-14 object-contain mb-2 drop-shadow-md" />
            <h3 className="text-xl font-black tracking-tight">IU RoomPeek</h3>
            <p className="text-xs text-sky-100 font-medium mt-0.5">
              Cổng thông tin & Đặt phòng sinh viên ĐH Quốc Tế
            </p>
          </div>
        </div>

        {/* TAB CHUYỂN ĐỔI ĐĂNG NHẬP / ĐĂNG KÝ */}
        <div className="flex border-b border-slate-150 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Đăng ký tài khoản
          </button>
        </div>

        {/* THÔNG BÁO LỖI HOẶC THÀNH CÔNG */}
        <div className="px-6 pt-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}
        </div>

        {/* BODY FORM */}
        <div className="p-6 pt-3">
          {tab === 'login' ? (
            /* FORM ĐĂNG NHẬP */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Mã số sinh viên (MSSV) hoặc Email IU</span>
                  {!loginData.emailOrStudentId.includes('@') && loginData.emailOrStudentId.trim() && (
                    <span className="text-[10px] text-sky-600 font-mono font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 animate-pulse">
                      + @student.hcmiu.edu.vn
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Chỉ cần điền MSSV (VD: ITITIU25055)..."
                    value={loginData.emailOrStudentId}
                    onBlur={() => {
                      const v = loginData.emailOrStudentId.trim();
                      if (v && !v.includes('@')) {
                        setLoginData(prev => ({
                          ...prev,
                          emailOrStudentId: `${v.toLowerCase()}@student.hcmiu.edu.vn`
                        }));
                      }
                    }}
                    onChange={(e) => setLoginData({ ...loginData, emailOrStudentId: e.target.value })}
                    className="w-full pl-10 pr-24 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                  {!loginData.emailOrStudentId.includes('@') && loginData.emailOrStudentId.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const v = loginData.emailOrStudentId.trim();
                        if (v && !v.includes('@')) {
                          setLoginData(prev => ({
                            ...prev,
                            emailOrStudentId: `${v.toLowerCase()}@student.hcmiu.edu.vn`
                          }));
                        }
                      }}
                      className="absolute right-2 top-2 px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-xl transition cursor-pointer"
                      title="Tự động thêm đuôi email trường"
                    >
                      + Thêm đuôi
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Bạn chỉ cần nhập MSSV, hệ thống tự động hoàn thiện <strong className="text-sky-700 font-mono">@student.hcmiu.edu.vn</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-sky-600 to-indigo-900 hover:from-sky-500 hover:to-indigo-950 text-white font-bold rounded-2xl transition shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Chưa có tài khoản sinh viên?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('register'); setError(''); }}
                    className="text-sky-600 font-bold hover:underline cursor-pointer"
                  >
                    Đăng ký tại đây
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* FORM ĐĂNG KÝ */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên sinh viên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email sinh viên IU <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAppendDomain}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-800 transition cursor-pointer flex items-center gap-0.5"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    + @student.hcmiu.edu.vn
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="MSSV@student.hcmiu.edu.vn"
                    value={registerData.email}
                    onChange={handleEmailChange}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Chỉ áp dụng định dạng: <code>@student.hcmiu.edu.vn</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã số sinh viên (MSSV) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: ITITWE25002"
                    value={registerData.studentId}
                    onChange={(e) => setRegisterData({ ...registerData, studentId: e.target.value.toUpperCase() })}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold uppercase transition"
                  />
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập lại mật khẩu"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-sky-600 to-indigo-900 hover:from-sky-500 hover:to-indigo-950 text-white font-bold rounded-2xl transition shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang tạo tài khoản...' : 'TẠO TÀI KHOẢN SINH VIÊN'}
              </button>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-500">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setError(''); }}
                    className="text-sky-600 font-bold hover:underline cursor-pointer"
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
