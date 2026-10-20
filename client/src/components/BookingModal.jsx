import { useState, useEffect } from 'react';
import { X, CalendarPlus, Clock, Users, MapPin, AlertCircle } from 'lucide-react';
import { createBooking, getBookedRanges, isTimeOverlapping } from '../services/api';

export default function BookingModal({ room, student, onClose, onSuccess }) {
  const today = '2026-10-19';
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [bookedRanges, setBookedRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step: 'TIME_SELECT' (Chọn giờ tự do) -> 'CONFIRM' (Ảnh 4: Xác nhận đặt phòng)
  const [step, setStep] = useState('TIME_SELECT');

  useEffect(() => {
    if (room) {
      getBookedRanges(room.id, date).then(setBookedRanges);
      setError('');
      setStep('TIME_SELECT');
    }
  }, [room, date]);

  // Kiểm tra hợp lệ và xung đột trùng giờ
  const handleProceedToConfirm = () => {
    setError('');
    if (!startTime || !endTime) {
      setError('Vui lòng chọn đầy đủ giờ điểm danh (bắt đầu) và giờ trả phòng (kết thúc)!');
      return;
    }
    if (startTime >= endTime) {
      setError('Giờ trả phòng (kết thúc) phải sau giờ điểm danh bắt đầu!');
      return;
    }

    // Check collision trực tiếp
    const conflict = bookedRanges.find(r => isTimeOverlapping(startTime, endTime, r.startTime, r.endTime));
    if (conflict) {
      setError(`Khung giờ bạn chọn (${startTime} - ${endTime}) bị trùng với lịch đã đặt trước của phòng này (${conflict.bookingCode}: ${conflict.startTime} - ${conflict.endTime})!`);
      return;
    }

    setStep('CONFIRM');
  };

  // Xác nhận đặt phòng
  const handleConfirmSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        roomId: room.id,
        roomName: room.name,
        roomType: room.type,
        studentId: student?.id || 'ITITIU20000',
        studentName: student?.name || 'Nguyễn Văn An',
        studentEmail: student?.email || 'ITITIU20000@student.hcmiu.edu.vn',
        groupSize: student?._groupSize || 5,
        bookingDate: date,
        startTime,
        endTime,
      };
      const result = await createBooking(payload);
      onSuccess?.(result);
      onClose();
    } catch (e) {
      setError(e.message || 'Không thể đặt phòng. Vui lòng thử lại.');
      setStep('TIME_SELECT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {/* =========================================================================
          BƯỚC 1: CHỌN MỐC GIỜ TỰ DO [ 10h45 ] — [ 11h30 ] (THEO ẢNH 1)
         ========================================================================= */}
      {step === 'TIME_SELECT' && (
        <div className="modal-box fade-in" style={{ maxWidth: '500px', width: '92vw' }}>
          <div className="modal-header">
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a8a' }}>
                Chọn giờ mượn phòng {room.id}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                {room.name} • Sức chứa: {room.capacityDisplay}
              </div>
            </div>
            <button className="modal-close" onClick={onClose}><X size={16} /></button>
          </div>

          <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '8px', padding: '0.75rem 1rem',
                color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: '8px', padding: '0.75rem 1rem',
              color: '#1e40af', fontSize: '0.85rem', marginBottom: '1.25rem'
            }}>
              💡 <strong>Lưu ý:</strong> Khi đặt phòng, phải có mốc giờ chọn tự do (VD: 10:45 – 11:30). Hệ thống sẽ tự động bắt lỗi nếu trùng lịch đã có trước!
            </div>

            {/* Khung giờ tự do */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem', color: '#374151', display: 'block', marginBottom: '6px' }}>
                Mốc giờ chọn tự do:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Giờ điểm danh</span>
                  <input
                    type="time"
                    className="form-input"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    style={{ fontWeight: '700', textAlign: 'center', fontSize: '0.95rem' }}
                  />
                </div>
                <span style={{ fontWeight: '800', color: '#9ca3af', marginTop: '18px' }}>—</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Giờ trả phòng</span>
                  <input
                    type="time"
                    className="form-input"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    style={{ fontWeight: '700', textAlign: 'center', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Presets gợi ý nhanh */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Khung giờ mẫu:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[
                  ['08:00', '10:00'],
                  ['10:00', '12:00'],
                  ['10:45', '11:30'],
                  ['13:00', '15:00'],
                ].map(([st, et], idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setStartTime(st); setEndTime(et); }}
                    style={{
                      padding: '5px 4px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: startTime === st && endTime === et ? '1.5px solid #1e40af' : '1px solid #e5e7eb',
                      background: startTime === st && endTime === et ? '#eff6ff' : '#f9fafb',
                      color: startTime === st && endTime === et ? '#1e40af' : '#4b5563',
                      cursor: 'pointer'
                    }}
                  >
                    {st}–{et}
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách các giờ đã bận */}
            {bookedRanges.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ef4444', display: 'block', marginBottom: '4px' }}>
                  Giờ phòng đã bận hôm nay:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                  {bookedRanges.map((r, i) => (
                    <div key={i} style={{
                      padding: '4px 8px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fecaca',
                      fontSize: '0.75rem', color: '#b91c1c', display: 'flex', justifyContent: 'space-between'
                    }}>
                      <span>🔒 {r.startTime} – {r.endTime}</span>
                      <span style={{ fontWeight: '700' }}>{r.bookingCode}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Đóng</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleProceedToConfirm}
              style={{ background: '#1e3a8a', color: 'white', fontWeight: '700', padding: '0.5rem 1.25rem' }}
            >
              Tiếp tục xác nhận →
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          BƯỚC 2: MODAL XÁC NHẬN ĐẶT PHÒNG (ĐÚNG 100% THEO ẢNH 4)
         ========================================================================= */}
      {step === 'CONFIRM' && (
        <div className="modal-box fade-in" style={{ maxWidth: '420px', width: '90vw', borderRadius: '20px', padding: '1.5rem' }}>
          {/* Header với icon xanh dương tròn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0284c7'
            }}>
              <CalendarPlus size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Xác nhận đặt phòng
            </h3>
          </div>

          {/* Hộp bo góc hiển thị Phòng & Giờ (Giống hệt ảnh 4) */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
              Phòng: <span style={{ color: '#1e3a8a' }}>{room.id}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: '700', color: '#475569' }}>
              <Clock size={16} color="#0284c7" />
              <span>{startTime} – {endTime}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
              {room.name} • 19/10/2026
            </div>
          </div>

          {/* 2 Nút: Hủy (trái) và Đồng ý đặt (phải) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setStep('TIME_SELECT')}
              style={{
                padding: '0.55rem 1.4rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#475569',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={loading}
              style={{
                padding: '0.55rem 1.6rem',
                borderRadius: '10px',
                border: 'none',
                background: '#1e3a8a',
                color: 'white',
                fontWeight: '800',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(30, 58, 138, 0.3)'
              }}
            >
              {loading ? 'Đang gửi...' : 'Đồng ý đặt'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
