import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, LayoutGrid, List, Building2 } from 'lucide-react';
import { getRooms } from '../services/api';
import RoomCard from '../components/RoomCard';
import BookingModal from '../components/BookingModal';

const BUILDINGS = ['Tất cả', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function RoomsPage({ student, groupSize, onNavigate }) {
  const [rooms, setRooms] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState('Tất cả');
  const [bookingRoom, setBookingRoom] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (e) {
      setError('Không tải được danh sách phòng: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter rooms
  useEffect(() => {
    let result = [...rooms];

    if (groupSize && !isNaN(parseInt(groupSize))) {
      const size = parseInt(groupSize);
      result = result.filter(r => !r.capacityMin || r.capacityMin <= size);
    }

    if (filterAvailable) {
      result = result.filter(r => r.isAvailableNow);
    }

    if (filterBuilding !== 'Tất cả') {
      result = result.filter(r => r.building === filterBuilding || r.name?.startsWith(filterBuilding));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.typeName?.toLowerCase().includes(q) ||
        r.building?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [rooms, search, filterAvailable, filterBuilding, groupSize]);

  const availableCount = filtered.filter(r => r.isAvailableNow).length;

  return (
    <div style={{ padding: '2rem 0 3rem' }}>
      <div className="container">
        {/* Page header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <h1 style={{ fontWeight: '900', fontSize: '1.6rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>
              🏫 Danh sách phòng
            </h1>
            {!loading && (
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                {availableCount} phòng trống / {filtered.length} phòng
                {groupSize ? ` (lọc cho nhóm ${groupSize} người)` : ''}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
              Tải lại
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={16} style={{
                position: 'absolute', left: '10px', top: '50%',
                transform: 'translateY(-50%)', color: '#9ca3af',
              }} />
              <input
                className="form-input"
                placeholder="Tìm kiếm phòng..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
            </div>

            {/* Available only toggle */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600',
              color: filterAvailable ? '#1e3a8a' : '#6b7280',
              whiteSpace: 'nowrap',
            }}>
              <div style={{
                position: 'relative',
                width: '36px', height: '20px',
              }}
                onClick={() => setFilterAvailable(v => !v)}
              >
                <div style={{
                  width: '36px', height: '20px',
                  borderRadius: '10px',
                  background: filterAvailable ? '#1e3a8a' : '#d1d5db',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }} />
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: filterAvailable ? '18px' : '2px',
                  width: '16px', height: '16px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              Chỉ phòng trống
            </label>

            {/* Building filter */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {BUILDINGS.slice(0, 5).map(b => (
                <button
                  key={b}
                  onClick={() => setFilterBuilding(b)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${filterBuilding === b ? '#1e3a8a' : '#e5e7eb'}`,
                    background: filterBuilding === b ? '#1e3a8a' : 'white',
                    color: filterBuilding === b ? 'white' : '#374151',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', padding: '1rem 1.25rem',
            color: '#dc2626', marginBottom: '1.5rem',
          }}>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
          }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                background: '#e2e8f0',
                borderRadius: '12px',
                height: '160px',
                animation: 'shimmer 1.5s ease-in-out infinite',
                opacity: 1 - (i % 4) * 0.1,
              }} />
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '14px',
            color: '#9ca3af',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Không tìm thấy phòng phù hợp
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </div>
          </div>
        )}

        {/* Room grid */}
        {!loading && filtered.length > 0 && (
          viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
            }}>
              {filtered.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onBook={student ? () => setBookingRoom(room) : null}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filtered.map(room => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  onBook={student ? () => setBookingRoom(room) : null}
                />
              ))}
            </div>
          )
        )}

        {/* No student warning */}
        {!student && !loading && filtered.length > 0 && (
          <div style={{
            marginTop: '1.5rem',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '0.875rem 1.25rem',
            fontSize: '0.875rem',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            ⚠️ Để đặt phòng, vui lòng{' '}
            <button
              onClick={() => onNavigate('home')}
              style={{
                background: 'none', border: 'none',
                color: '#1e3a8a', fontWeight: '700',
                cursor: 'pointer', textDecoration: 'underline',
                fontFamily: 'inherit', fontSize: 'inherit',
              }}
            >
              nhập thông tin sinh viên
            </button>{' '}
            tại trang chủ.
          </div>
        )}
      </div>

      {bookingRoom && student && (
        <BookingModal
          room={bookingRoom}
          student={student}
          onClose={() => setBookingRoom(null)}
          onSuccess={() => { setBookingRoom(null); load(); }}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function RoomListItem({ room, onBook }) {
  const available = room.isAvailableNow;
  return (
    <div style={{
      background: 'white',
      border: '1.5px solid #e5e7eb',
      borderRadius: '10px',
      padding: '0.875rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      transition: 'box-shadow 0.15s, border-color 0.15s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,58,138,0.1)';
        e.currentTarget.style.borderColor = '#93c5fd';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }}
    >
      <div style={{
        width: '44px', height: '44px',
        background: '#1e3a8a',
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: '800', fontSize: '0.75rem',
        flexShrink: 0,
        textAlign: 'center',
        lineHeight: 1.1,
      }}>
        <Building2 size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '700', color: '#1e3a8a', fontSize: '1rem' }}>{room.name}</div>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
          {[room.typeName, room.capacityDisplay, room.building && `Tòa ${room.building}`].filter(Boolean).join(' • ')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          padding: '3px 10px', borderRadius: '999px',
          background: available ? '#dcfce7' : '#f3f4f6',
          color: available ? '#15803d' : '#6b7280',
          fontWeight: '700', fontSize: '0.75rem',
          border: `1px solid ${available ? '#bbf7d0' : '#e5e7eb'}`,
        }}>
          {available ? 'TRỐNG' : 'ĐÃ ĐẶT'}
        </span>
        {available && onBook && (
          <button
            onClick={onBook}
            className="btn btn-primary btn-sm"
          >
            Đặt ngay
          </button>
        )}
      </div>
    </div>
  );
}
