import { useState } from 'react';
import { CheckCircle2, Home, X, Clock, MapPin, Hash } from 'lucide-react';
import { checkIn, checkOut, cancelBooking } from '../services/api';

export default function BookingBanner({ booking, onRefresh }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  if (!booking) return null;

  const canCheckIn = booking?.attendance?.checkIn?.canCheckIn;
  const canCheckOut = booking?.attendance?.checkOut?.canCheckOut;
  const checkInLabel = booking?.attendance?.checkIn?.label || 'Xác nhận đã mượn phòng';
  const checkOutLabel = booking?.attendance?.checkOut?.label || 'Xác nhận trả phòng';

  const handle = async (action) => {
    setLoading(action);
    setError('');
    try {
      if (action === 'checkin') await checkIn(booking.id);
      if (action === 'checkout') await checkOut(booking.id);
      if (action === 'cancel') await cancelBooking(booking.id);
      onRefresh?.();
    } catch (e) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(null);
    }
  };

  const isActive = booking.status === 'CONFIRMED';

  return (
    <div
      className="fade-in"
      style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
        borderRadius: '10px',
        padding: '1.25rem 1.5rem',
        color: 'white',
        boxShadow: '0 6px 20px rgba(30,58,138,0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blob */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20px', left: '40%',
        width: '80px', height: '80px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 8px #22c55e',
          animation: 'pulse 2s infinite',
        }} />
        <span style={{ fontWeight: '700', fontSize: '1rem' }}>
          Bạn đã đặt phòng:{' '}
          <span style={{ color: '#93c5fd', fontWeight: '800' }}>{booking.roomName}</span>
        </span>
      </div>

      {/* Info grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.5rem',
        marginBottom: '1rem',
      }}>
        {booking.timeDisplay && (
          <InfoChip icon={<Clock size={13} />} label={booking.timeDisplay} />
        )}
        {booking.bookingCode && (
          <InfoChip icon={<Hash size={13} />} label={`Mã: ${booking.bookingCode}`} />
        )}
        {booking.bookingDate && (
          <InfoChip icon={<MapPin size={13} />} label={booking.bookingDate} />
        )}
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.2)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.83rem',
          marginBottom: '0.75rem',
          color: '#fca5a5',
        }}>
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        {canCheckIn && (
          <button
            onClick={() => handle('checkin')}
            disabled={!!loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.1rem',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && loading !== 'checkin' ? 0.6 : 1,
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {loading === 'checkin' ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <CheckCircle2 size={15} />}
            {checkInLabel}
          </button>
        )}
        {canCheckOut && (
          <button
            onClick={() => handle('checkout')}
            disabled={!!loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: '8px',
              padding: '0.5rem 1.1rem',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && loading !== 'checkout' ? 0.6 : 1,
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {loading === 'checkout' ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Home size={15} />}
            {checkOutLabel}
          </button>
        )}
        {isActive && (
          <button
            onClick={() => handle('cancel')}
            disabled={!!loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(239,68,68,0.2)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '0.5rem 0.9rem',
              fontWeight: '600',
              fontSize: '0.82rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && loading !== 'cancel' ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading === 'cancel' ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <X size={14} />}
            Hủy đặt phòng
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function InfoChip({ icon, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '6px',
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem',
      color: 'rgba(255,255,255,0.85)',
    }}>
      {icon}
      {label}
    </div>
  );
}
