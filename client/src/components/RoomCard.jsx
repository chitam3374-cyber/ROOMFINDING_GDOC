import { Users, Building2, CheckCircle } from 'lucide-react';

export default function RoomCard({ room, onBook, compact = false }) {
  const available = room.isAvailableNow;
  const isAuditorium = room.type === 'AUDITORIUM';

  return (
    <div
      style={{
        background: '#1e3a8a',
        borderRadius: compact ? '12px' : '14px',
        padding: compact ? '1.1rem' : '1.25rem',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.75rem',
        boxShadow: '0 4px 14px rgba(30,58,138,0.25)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 22px rgba(30,58,138,0.35)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(30,58,138,0.25)';
      }}
    >
      {/* Header: room ID + TRỐNG/ĐÃ ĐẶT badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: compact ? '1.15rem' : '1.3rem', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
            {room.id || room.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              background: 'rgba(255,255,255,0.18)',
              padding: '2px 7px',
              borderRadius: '5px',
              color: '#dbeafe'
            }}>
              {room.typeName || (isAuditorium ? 'Giảng đường' : 'Phòng học')}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
              {isAuditorium ? '36 – 150 người' : '1 – 35 người'}
            </span>
          </div>
        </div>

        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: '3px 9px',
          borderRadius: '999px',
          fontSize: '0.7rem',
          fontWeight: '800',
          letterSpacing: '0.5px',
          background: available ? '#10b981' : '#64748b',
          color: 'white',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {available ? <CheckCircle size={11} /> : null}
          {available ? 'TRỐNG' : 'ĐÃ ĐẶT'}
        </span>
      </div>

      {/* Info row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>
        {room.capacityDisplay && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={13} color="#93c5fd" />
            <span>Sức chứa: {room.capacityDisplay} người</span>
          </div>
        )}
        {room.building && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Building2 size={13} color="#93c5fd" />
            <span>Tòa {room.building}{room.floor ? ` • Tầng ${room.floor}` : ''}</span>
          </div>
        )}
      </div>

      {/* Book button */}
      {available && onBook && (
        <button
          onClick={() => onBook(room)}
          style={{
            marginTop: '0.25rem',
            background: 'white',
            border: 'none',
            borderRadius: '9px',
            color: '#1e3a8a',
            padding: compact ? '0.45rem 0.8rem' : '0.55rem 1rem',
            fontSize: '0.85rem',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'background 0.15s, transform 0.1s',
            width: '100%',
            fontFamily: 'inherit',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={e => { e.target.style.background = '#f1f5f9'; }}
          onMouseLeave={e => { e.target.style.background = 'white'; }}
        >
          Đặt ngay →
        </button>
      )}
    </div>
  );
}
