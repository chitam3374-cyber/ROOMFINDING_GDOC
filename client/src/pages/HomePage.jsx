import { useState, useEffect, useCallback, useMemo } from 'react';
import { Mail, Users, Zap, Search, AlertCircle, School, Building2, Sparkles } from 'lucide-react';
import { getStudent, getActiveBooking, getRooms } from '../services/api';
import RoomCard from '../components/RoomCard';
import BookingBanner from '../components/BookingBanner';
import BookingModal from '../components/BookingModal';

export default function HomePage({ onNavigate }) {
  const [emailOrMssv, setEmailOrMssv] = useState('ITITIU20000@student.hcmiu.edu.vn');
  const [groupSize, setGroupSize] = useState('5');
  const [student, setStudent] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [showActiveBooking, setShowActiveBooking] = useState(false);
  const [allRooms, setAllRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [bookingRoom, setBookingRoom] = useState(null);

  // Tab lọc quy mô: 'ALL' | 'CLASSROOM' (1 - 35 người) | 'AUDITORIUM' (36 - 150 người)
  const [scaleFilter, setScaleFilter] = useState('ALL');

  // Điều khiển chạy carousel chọn phòng nhanh
  const [direction, setDirection] = useState('ltr'); // 'ltr': trái sang phải | 'rtl': phải sang trái
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Load rooms on mount
  useEffect(() => {
    getRooms()
      .then(setAllRooms)
      .catch(() => setAllRooms([]))
      .finally(() => setLoadingRooms(false));
  }, []);

  // Tự động đồng bộ tab quy mô theo số lượng người nhập trong form
  const numGroupSize = Number(groupSize) || 0;
  useEffect(() => {
    if (numGroupSize > 0 && numGroupSize <= 35) {
      setScaleFilter('CLASSROOM');
    } else if (numGroupSize >= 36) {
      setScaleFilter('AUDITORIUM');
    } else {
      setScaleFilter('ALL');
    }
  }, [groupSize]);

  // Load active booking
  const loadActiveBooking = useCallback(async (studentIdOrEmail) => {
    try {
      const b = await getActiveBooking(studentIdOrEmail);
      setActiveBooking(b);
      return b;
    } catch {
      setActiveBooking(null);
      return null;
    }
  }, []);

  // Xử lý khi bấm nút → ĐẶT PHÒNG
  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = emailOrMssv.trim();
    const size = parseInt(groupSize, 10);

    if (!clean) { setFormError('Vui lòng nhập Email hoặc MSSV'); return; }
    if (!groupSize || isNaN(size) || size < 1) { setFormError('Vui lòng nhập quy mô nhóm hợp lệ (lớn hơn 0)'); return; }

    setFormLoading(true);
    setFormError('');

    try {
      const s = await getStudent(clean);
      if (s.status === 'banned') {
        setFormError(`Tài khoản sinh viên ${s.id} hiện đang bị khóa quyền mượn phòng.`);
        return;
      }

      s._groupSize = size;
      setStudent(s);

      // Kiểm tra xem sinh viên đã có phòng đang mượn chưa
      const existing = await loadActiveBooking(s.id);
      if (existing) {
        setShowActiveBooking(true);
      } else {
        setShowActiveBooking(false);
        // Cuộn mượt xuống phần Chọn phòng nhanh
        const el = document.getElementById('quick-rooms-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (err) {
      setFormError(err.message || 'Có lỗi xảy ra khi kiểm tra thông tin sinh viên.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleQuickBook = (room) => {
    if (activeBooking && showActiveBooking) {
      alert('Bạn đang có phòng mượn chưa hoàn tất. Vui lòng trả phòng trước khi mượn tiếp!');
      return;
    }
    const currentStudent = student || {
      id: emailOrMssv.split('@')[0].toUpperCase(),
      name: 'Nguyễn Văn An',
      email: emailOrMssv.includes('@') ? emailOrMssv : `${emailOrMssv}@student.hcmiu.edu.vn`,
      _groupSize: Number(groupSize) || 5
    };
    setStudent(currentStudent);
    setBookingRoom(room);
  };

  const handleBookingSuccess = (newBooking) => {
    setBookingRoom(null);
    setActiveBooking(newBooking);
    setShowActiveBooking(true);
  };

  // Lọc phòng theo quy mô
  const displayedQuickRooms = allRooms.filter(r => {
    if (scaleFilter === 'CLASSROOM') return r.type === 'CLASSROOM';
    if (scaleFilter === 'AUDITORIUM') return r.type === 'AUDITORIUM';
    return true;
  });

  // Chuẩn bị danh sách phòng lặp vô tận cho marquee (không bao giờ bị giật hay rỗng)
  const marqueeRooms = useMemo(() => {
    if (displayedQuickRooms.length === 0) return [];
    let items = [...displayedQuickRooms];
    while (items.length < 8) {
      items = [...items, ...displayedQuickRooms];
    }
    return [...items, ...items];
  }, [displayedQuickRooms]);

  // Tốc độ lướt mượt mà ~55px/giây
  const animDuration = Math.max(25, (marqueeRooms.length / 2) * 4.5);

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container">
        {/* =========================================================================
            FORM THÔNG TIN MƯỢN PHÒNG (LUÔN HIỆN ĐẦU TIÊN KHI MỚI VÀO TRANG)
           ========================================================================= */}
        <div style={{ maxWidth: '640px', margin: '0 auto 3rem auto' }}>
          <div className="card" style={{
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            background: 'white',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Top accent bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
              background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)'
            }} />

            <h2 style={{
              textAlign: 'center',
              color: '#0f172a',
              fontWeight: '800',
              fontSize: '1.45rem',
              marginBottom: '1.5rem',
              letterSpacing: '-0.3px'
            }}>
              Thông tin mượn phòng
            </h2>

            {/* Nếu đã bấm ĐẶT PHÒNG và sinh viên có phòng active -> Hiển thị thẻ phòng đang mượn */}
            {showActiveBooking && activeBooking ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="fade-in">
                <BookingBanner
                  booking={activeBooking}
                  onRefresh={() => loadActiveBooking(emailOrMssv)}
                />

                <div style={{
                  padding: '0.75rem 1rem', background: '#fffbeb', border: '1px solid #fef3c7',
                  borderRadius: '8px', fontSize: '0.8rem', color: '#b45309', textAlign: 'center', fontWeight: '600'
                }}>
                  ⚠️ Bạn đang có phòng mượn chưa hoàn tất. Mỗi sinh viên chỉ được đặt 1 phòng trong cùng một thời điểm.
                </div>
              </div>
            ) : (
              /* Mặc định: Luôn hiển thị Form sạch sẽ đầu tiên */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Nhập email sinh viên hoặc MSSV
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                      <Mail size={18} />
                    </div>
                    <input
                      className="form-input"
                      placeholder="Nhập email sinh viên của bạn (VD: ITITIU20000@student.hcmiu.edu.vn)"
                      value={emailOrMssv}
                      onChange={e => { setEmailOrMssv(e.target.value); setFormError(''); }}
                      style={{ paddingLeft: '40px', fontSize: '0.9rem', borderRadius: '8px', background: '#f8fafc', height: '46px' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Chấp nhận email trường HCMIU hoặc mã số sinh viên trực tiếp
                  </span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Số lượng thành viên (Quy mô nhóm)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                      <Users size={18} />
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      className="form-input"
                      placeholder="Số lượng thành viên (VD: 5)"
                      value={groupSize}
                      onChange={e => { setGroupSize(e.target.value); setFormError(''); }}
                      style={{ paddingLeft: '40px', fontSize: '0.9rem', borderRadius: '8px', background: '#f8fafc', height: '46px' }}
                    />
                  </div>
                </div>

                {formError && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: '8px', padding: '0.75rem 1rem',
                    color: '#dc2626', fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    marginTop: '0.5rem',
                    background: '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: 'inherit'
                  }}
                >
                  {formLoading ? 'Đang kiểm tra...' : '→ ĐẶT PHÒNG'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* =========================================================================
            SECTION: CHỌN PHÒNG NHANH (CAROUSEL MARQUEE VÔ TẬN, CẮT 2 BÊN ĐỀU, LƯỚT THÌ DỪNG)
           ========================================================================= */}
        <div id="quick-rooms-section" style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          padding: '1.25rem 0 0.5rem 0',
        }}>
          {/* Header Bar của cụm Đặt phòng nhanh */}
          <div style={{
            padding: '0 1.5rem 1rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            {/* Title & Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#d97706'
              }}>
                <Zap size={20} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ color: '#0f172a', fontWeight: '800', fontSize: '1.2rem', margin: 0 }}>
                    Chọn phòng nhanh
                  </h2>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px',
                    borderRadius: '6px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe'
                  }}>
                    {displayedQuickRooms.length} phòng khả dụng
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  Trượt tự động liên tục • Rê chuột vào để dừng xem chi tiết & đặt phòng
                </div>
              </div>
            </div>

            {/* Điều khiển: Trạng thái trượt + Hướng chạy + Xem tất cả */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Badge trạng thái animation */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: (isHovered || isPaused) ? '#fef2f2' : '#ecfdf5',
                  color: (isHovered || isPaused) ? '#dc2626' : '#059669',
                  border: (isHovered || isPaused) ? '1px solid #fecaca' : '1px solid #a7f3d0',
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}
              >
                {(isHovered || isPaused) ? (
                  <>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }} />
                    <span>Đang dừng (Rê chuột ra để tiếp tục)</span>
                  </>
                ) : (
                  <>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
                    <span>Đang trượt (Rê chuột vào để dừng)</span>
                  </>
                )}
              </div>

              {/* Bộ chuyển hướng chạy */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  title="Chạy từ trái sang phải"
                  onClick={() => setDirection('ltr')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    background: direction === 'ltr' ? 'white' : 'transparent',
                    color: direction === 'ltr' ? '#1e40af' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: direction === 'ltr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  Trái → Phải
                </button>
                <button
                  type="button"
                  title="Chạy từ phải sang trái"
                  onClick={() => setDirection('rtl')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    background: direction === 'rtl' ? 'white' : 'transparent',
                    color: direction === 'rtl' ? '#1e40af' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: direction === 'rtl' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  Phải → Trái
                </button>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => onNavigate('rooms', { groupSize: Number(groupSize) || 5 })}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', fontWeight: '700', padding: '0.4rem 0.85rem' }}
              >
                <Search size={14} /> Tất cả phòng
              </button>
            </div>
          </div>

          {/* Thanh lọc theo Quy mô */}
          <div style={{
            padding: '0.75rem 1.5rem',
            background: '#f8fafc',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                Quy mô:
              </span>

              <button
                type="button"
                onClick={() => setScaleFilter('ALL')}
                style={{
                  padding: '5px 12px', borderRadius: '6px', border: 'none',
                  background: scaleFilter === 'ALL' ? '#1e3a8a' : 'white',
                  color: scaleFilter === 'ALL' ? 'white' : '#475569',
                  boxShadow: scaleFilter === 'ALL' ? '0 1px 4px rgba(30,58,138,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                  fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Tất cả ({allRooms.length})
              </button>

              <button
                type="button"
                onClick={() => setScaleFilter('CLASSROOM')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '6px', border: 'none',
                  background: scaleFilter === 'CLASSROOM' ? '#1e3a8a' : 'white',
                  color: scaleFilter === 'CLASSROOM' ? 'white' : '#475569',
                  boxShadow: scaleFilter === 'CLASSROOM' ? '0 1px 4px rgba(30,58,138,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                  fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <School size={14} /> Phòng học: 1 → 35 người
              </button>

              <button
                type="button"
                onClick={() => setScaleFilter('AUDITORIUM')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '6px', border: 'none',
                  background: scaleFilter === 'AUDITORIUM' ? '#1e3a8a' : 'white',
                  color: scaleFilter === 'AUDITORIUM' ? 'white' : '#475569',
                  boxShadow: scaleFilter === 'AUDITORIUM' ? '0 1px 4px rgba(30,58,138,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                  fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Building2 size={14} /> Giảng đường: 36 → 150 người
              </button>
            </div>

            {numGroupSize > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#1e40af', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px' }}>
                <Sparkles size={13} color="#f59e0b" />
                <span>
                  Quy mô: <strong>{numGroupSize} người</strong> ➔ Đang gợi ý:{' '}
                  <strong>{numGroupSize <= 35 ? 'Phòng học (1 - 35 người)' : 'Giảng đường (36 - 150 người)'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* VIEWPORT MARQUEE: CẮT 2 BÊN ĐỀU BẰNG GRADIENT MASK (CÂN XỨNG, KHÔNG TRÀN WEB) */}
          <div
            className="quick-rooms-viewport"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              overflow: 'hidden',
              position: 'relative',
              width: '100%',
              padding: '1.25rem 0',
              maskImage: 'linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)',
            }}
          >
            {loadingRooms ? (
              <div style={{ display: 'flex', gap: '16px', padding: '0 1.5rem' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ width: '265px', minWidth: '265px', height: '175px', background: '#e2e8f0', borderRadius: '10px', flexShrink: 0 }} />
                ))}
              </div>
            ) : displayedQuickRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                Không có phòng nào phù hợp với quy mô này hiện tại.
              </div>
            ) : (
              <div
                className="quick-rooms-track"
                style={{
                  display: 'flex',
                  gap: '16px',
                  width: 'max-content',
                  animationName: direction === 'ltr' ? 'marqueeLeftToRight' : 'marqueeRightToLeft',
                  animationDuration: `${animDuration}s`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  animationPlayState: (isHovered || isPaused) ? 'paused' : 'running',
                  willChange: 'transform'
                }}
              >
                {marqueeRooms.map((room, idx) => (
                  <div
                    key={`${room.id}-${idx}`}
                    style={{
                      width: '265px',
                      minWidth: '265px',
                      flexShrink: 0,
                    }}
                  >
                    <RoomCard
                      room={room}
                      compact
                      onBook={handleQuickBook}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <style>{`
            @keyframes marqueeLeftToRight {
              0% {
                transform: translateX(-50%);
              }
              100% {
                transform: translateX(0%);
              }
            }

            @keyframes marqueeRightToLeft {
              0% {
                transform: translateX(0%);
              }
              100% {
                transform: translateX(-50%);
              }
            }

            .quick-rooms-track:hover {
              animation-play-state: paused !important;
            }
          `}</style>
        </div>
      </div>

      {/* Booking Modal với mốc giờ tự do và popup xác nhận */}
      {bookingRoom && (
        <BookingModal
          room={bookingRoom}
          student={student || { id: 'ITITIU20000', name: 'Nguyễn Văn An', email: 'ITITIU20000@student.hcmiu.edu.vn', _groupSize: Number(groupSize) || 5 }}
          onClose={() => setBookingRoom(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
