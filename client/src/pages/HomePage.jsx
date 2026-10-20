import { useState, useEffect, useCallback } from 'react';
import { Mail, Users, Zap, Search, AlertCircle, ArrowLeft, School, Building2, Sparkles } from 'lucide-react';
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

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container">
        {/* =========================================================================
            FORM THÔNG TIN MƯỢN PHÒNG (LUÔN HIỆN ĐẦU TIÊN KHI MỚI VÀO TRANG)
           ========================================================================= */}
        <div style={{ maxWidth: '640px', margin: '0 auto 3rem auto' }}>
          <div className="card" style={{
            padding: '2rem',
            borderRadius: '5px',
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
                  borderRadius: '5px', fontSize: '0.8rem', color: '#b45309', textAlign: 'center', fontWeight: '600'
                }}>
                  ⚠️ Bạn đang có phòng mượn chưa hoàn tất. Mỗi sinh viên chỉ được đặt 1 phòng trong cùng một thời điểm.
                </div>

                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowActiveBooking(false)}
                    style={{
                      border: 'none', background: 'transparent', color: '#1e40af',
                      fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <ArrowLeft size={15} /> Quay lại form nhập thông tin mượn phòng
                  </button>
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
                      style={{ paddingLeft: '40px', fontSize: '0.9rem', borderRadius: '5px', background: '#f8fafc', height: '46px' }}
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
                      style={{ paddingLeft: '40px', fontSize: '0.9rem', borderRadius: '5px', background: '#f8fafc', height: '46px' }}
                    />
                  </div>
                </div>

                {formError && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: '5px', padding: '0.75rem 1rem',
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
                    borderRadius: '5px',
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
            SECTION: CHỌN PHÒNG NHANH (THEO QUY MÔ PHÒNG HỌC 1-35 & GIẢNG ĐƯỜNG 36-150)
           ========================================================================= */}
        <div id="quick-rooms-section">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={22} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
              <h2 style={{ color: '#0f172a', fontWeight: '800', fontSize: '1.25rem', margin: 0 }}>
                Chọn phòng nhanh
              </h2>
              <span style={{
                fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px',
                borderRadius: '5px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe'
              }}>
                Gợi ý theo quy mô nhóm
              </span>
            </div>

            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('rooms', { groupSize: Number(groupSize) || 5 })}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '5px', fontWeight: '700' }}
            >
              <Search size={14} /> Xem tất cả phòng
            </button>
          </div>

          {/* Thanh lọc theo Quy mô: Phòng học 1-35 vs Giảng đường 36-150 */}
          <div style={{
            background: 'white', padding: '0.75rem 1rem', borderRadius: '5px',
            border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                Quy mô:
              </span>

              <button
                type="button"
                onClick={() => setScaleFilter('ALL')}
                style={{
                  padding: '5px 12px', borderRadius: '5px', border: 'none',
                  background: scaleFilter === 'ALL' ? '#1e3a8a' : '#f1f5f9',
                  color: scaleFilter === 'ALL' ? 'white' : '#475569',
                  fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                }}
              >
                Tất cả phòng
              </button>

              <button
                type="button"
                onClick={() => setScaleFilter('CLASSROOM')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '5px', border: 'none',
                  background: scaleFilter === 'CLASSROOM' ? '#1e3a8a' : '#f1f5f9',
                  color: scaleFilter === 'CLASSROOM' ? 'white' : '#475569',
                  fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                }}
              >
                <School size={14} /> Phòng học: từ 1 → 35 người
              </button>

              <button
                type="button"
                onClick={() => setScaleFilter('AUDITORIUM')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '5px', border: 'none',
                  background: scaleFilter === 'AUDITORIUM' ? '#1e3a8a' : '#f1f5f9',
                  color: scaleFilter === 'AUDITORIUM' ? 'white' : '#475569',
                  fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                }}
              >
                <Building2 size={14} /> Giảng đường: từ 36 → 150 người
              </button>
            </div>

            {numGroupSize > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#1e40af', background: '#eff6ff', padding: '4px 10px', borderRadius: '5px' }}>
                <Sparkles size={13} color="#f59e0b" />
                <span>
                  Quy mô: <strong>{numGroupSize} người</strong> ➔ Đang gợi ý:{' '}
                  <strong>{numGroupSize <= 35 ? 'Phòng học (1 - 35 người)' : 'Giảng đường (36 - 150 người)'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Danh sách phòng nhanh */}
          {loadingRooms ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ background: '#e2e8f0', borderRadius: '5px', height: '160px' }} />
              ))}
            </div>
          ) : displayedQuickRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '5px', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
              Không có phòng nào phù hợp với quy mô này hiện tại.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' }}>
              {displayedQuickRooms.slice(0, 5).map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  compact
                  onBook={handleQuickBook}
                />
              ))}
            </div>
          )}
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
