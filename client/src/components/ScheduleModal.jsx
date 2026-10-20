import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Users, 
  Building2, 
  Filter, 
  LayoutGrid, 
  CalendarDays 
} from 'lucide-react';
import { getScheduleMatrix, getRooms, getAllBookings, timeToMinutes } from '../services/api';

const START_HOUR = 7;
const END_HOUR = 18;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 64;
const HOURS_LIST = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

export default function ScheduleModal({ onClose }) {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'matrix'
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [matrixData, setMatrixData] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    getRooms().then(setRooms);
    getScheduleMatrix().then(res => {
      setMatrixData(res?.rooms || []);
      setBookings(res?.bookings || getAllBookings());
    });
  }, []);

  useEffect(() => {
    if (viewMode === 'calendar' && scrollRef.current) {
      scrollRef.current.scrollTop = HOUR_HEIGHT * 0.8;
    }
  }, [viewMode]);

  const filteredRooms = rooms.filter(r => {
    if (selectedBuilding === 'ALL') return true;
    return r.building === selectedBuilding;
  });

  const getEventPosition = (startTime, endTime) => {
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const baseMin = START_HOUR * 60;
    const top = Math.max(0, ((startMin - baseMin) / 60) * HOUR_HEIGHT);
    const durationMin = Math.max(30, endMin - startMin);
    const height = Math.max(36, (durationMin / 60) * HOUR_HEIGHT - 4);
    return { top, height };
  };

  const getEventBgColor = (roomType, isCustomSpan) => {
    if (isCustomSpan) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    switch (roomType) {
      case 'AUDITORIUM': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'LAB': return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
      default: return 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="modal-box fade-in"
        style={{
          maxWidth: '1100px',
          width: '95vw',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          padding: 0,
          overflow: 'hidden',
          background: 'white',
          position: 'relative'
        }}
      >
        {/* =========================================================================
            HEADER BAR PHONG CÁCH GOOGLE CALENDAR
           ========================================================================= */}
        <div style={{
          padding: '0.85rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '8px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1d4ed8'
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1e293b' }}>
                  Lịch phòng IU
                </span>
                <span style={{
                  fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px',
                  borderRadius: '6px', background: '#dbeafe', color: '#1e40af'
                }}>
                  Google Calendar View
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Thứ Hai, 19/10/2026 • Học kỳ 1
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px', borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
              <button
                type="button"
                onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = HOUR_HEIGHT * 0.8; }}
                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Hôm nay
              </button>
              <button type="button" style={{ border: 'none', background: 'transparent', padding: '4px', cursor: 'pointer', color: '#64748b' }}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" style={{ border: 'none', background: 'transparent', padding: '4px', cursor: 'pointer', color: '#64748b' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Lọc tòa */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem' }}>
              <Filter size={13} color="#64748b" />
              <select
                value={selectedBuilding}
                onChange={e => setSelectedBuilding(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', fontWeight: '600', color: '#334155', cursor: 'pointer', outline: 'none' }}
              >
                <option value="ALL">Tất cả tòa</option>
                <option value="A1">Tòa A1</option>
                <option value="A2">Tòa A2</option>
                <option value="LA1">Tòa Lab LA1</option>
                <option value="Library">Thư viện</option>
              </select>
            </div>

            {/* Toggle Calendar vs Matrix */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '6px', border: 'none',
                  background: viewMode === 'calendar' ? 'white' : 'transparent',
                  color: viewMode === 'calendar' ? '#1e40af' : '#64748b',
                  boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
              >
                <CalendarDays size={13} /> Google Calendar
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '6px', border: 'none',
                  background: viewMode === 'matrix' ? 'white' : 'transparent',
                  color: viewMode === 'matrix' ? '#1e40af' : '#64748b',
                  boxShadow: viewMode === 'matrix' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
              >
                <LayoutGrid size={13} /> Bảng Ma trận
              </button>
            </div>

            <button className="modal-close" onClick={onClose} style={{ marginLeft: '4px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Thanh ghi chú Chen Ngang */}
        <div style={{
          padding: '6px 20px', background: '#eff6ff', borderBottom: '1px solid #dbeafe',
          fontSize: '0.75rem', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span>
            💡 <strong>Lịch chen ngang:</strong> Khung giờ tùy chọn như{' '}
            <strong style={{ color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: '6px' }}>
              10h30 – 13h30 tại A1.102
            </strong>{' '}
            được trải dài tự nhiên theo trục thời gian thực.
          </span>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#2563eb' }} /> Phòng học
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }} /> Giảng đường
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }} /> Lịch chen ngang
            </span>
          </div>
        </div>

        {/* =========================================================================
            CHẾ ĐỘ 1: GOOGLE CALENDAR VIEW
           ========================================================================= */}
        {viewMode === 'calendar' ? (
          <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', background: '#f8fafc', position: 'relative' }}>
            <div style={{ minWidth: `${filteredRooms.length * 140 + 60}px`, display: 'flex', flexDirection: 'column' }}>
              {/* Sticky Columns Header */}
              <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', background: 'white', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '60px', flexShrink: 0, borderRight: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700' }}>
                  GMT+7
                </div>
                <div style={{ display: 'flex', flex: 1 }}>
                  {filteredRooms.map(r => (
                    <div key={r.id} style={{ width: '140px', minWidth: '130px', flex: 1, padding: '8px 4px', borderRight: '1px solid #e2e8f0', textAlign: 'center', background: 'white' }}>
                      <div style={{ fontWeight: '800', color: '#1e3a8a', fontSize: '0.95rem' }}>{r.id}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.subType || r.typeName}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{r.capacityDisplay} người</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Body */}
              <div style={{ display: 'flex', flex: 1, position: 'relative', background: 'white' }}>
                {/* Time Gutter */}
                <div style={{ width: '60px', flexShrink: 0, borderRight: '1px solid #e2e8f0', background: '#f8fafc', userSelect: 'none' }}>
                  {HOURS_LIST.map(h => (
                    <div key={h} style={{ height: `${HOUR_HEIGHT}px`, borderBottom: '1px solid #f1f5f9', paddingRight: '6px', paddingTop: '4px', textAlign: 'right', fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>
                      {h < 10 ? `0${h}:00` : `${h}:00`}
                    </div>
                  ))}
                </div>

                {/* Columns */}
                <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                  {/* Current Time Red Line Indicator (10:45) */}
                  <div style={{ position: 'absolute', top: `${(10.75 - START_HOUR) * HOUR_HEIGHT}px`, left: 0, right: 0, zIndex: 8, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginLeft: '-4px' }} />
                    <div style={{ flex: 1, height: '1.5px', background: '#ef4444' }} />
                    <span style={{ padding: '1px 5px', borderRadius: '5px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: '800', marginRight: '6px' }}>
                      Hiện tại 10:45
                    </span>
                  </div>

                  {filteredRooms.map(room => {
                    const roomBookings = bookings.filter(b => b.roomId === room.id && b.status === 'CONFIRMED');

                    return (
                      <div key={room.id} style={{ width: '140px', minWidth: '130px', flex: 1, borderRight: '1px solid #e2e8f0', position: 'relative' }}>
                        {HOURS_LIST.map(h => (
                          <div key={h} style={{ height: `${HOUR_HEIGHT}px`, borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderBottom: '1px dashed #f8fafc' }} />
                          </div>
                        ))}

                        {/* Event blocks */}
                        {roomBookings.map(b => {
                          const { top, height } = getEventPosition(b.startTime, b.endTime);
                          const isCustomSpan = b.startTime === '10:30' || b.endTime === '13:30';

                          return (
                            <div
                              key={b.id}
                              style={{
                                position: 'absolute',
                                top: `${top}px`,
                                height: `${height}px`,
                                left: '4px',
                                right: '4px',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                background: getEventBgColor(b.roomType, isCustomSpan),
                                color: 'white',
                                zIndex: 5,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                overflow: 'hidden',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                transition: 'transform 0.1s'
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedEvent(b);
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.95, textTransform: 'uppercase' }}>
                                  {b.bookingCode}
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {b.studentName || 'Sinh viên IU'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', opacity: 0.9 }}>
                                <Clock size={10} />
                                <span>{b.startTime}–{b.endTime}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              CHẾ ĐỘ 2: BẢNG MA TRẬN 4 KHUNG GIỜ
             ========================================================================= */
          <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem 1.5rem', background: '#f8fafc' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <thead>
                <tr style={{ background: '#1e3a8a', color: 'white' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700' }}>PHÒNG</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>08:00 – 10:00</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>10:00 – 12:00</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>13:00 – 15:00</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>15:00 – 17:00</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.map(row => {
                  const hasCustom = row.customBookings && row.customBookings.length > 0;
                  return (
                    <tr key={row.roomId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '800', color: '#1e3a8a' }}>
                        {row.roomId}
                      </td>
                      {hasCustom ? (
                        <>
                          <td style={{ padding: '8px', textAlign: 'center', background: '#dcfce7', color: '#15803d', fontWeight: '700' }}>Trống</td>
                          <td colSpan={2} style={{ padding: '6px', textAlign: 'center' }}>
                            <div style={{ background: '#10b981', color: 'white', padding: '6px', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem' }}>
                              {row.customBookings[0].label}
                            </div>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', background: '#dcfce7', color: '#15803d', fontWeight: '700' }}>Trống</td>
                        </>
                      ) : (
                        row.slots?.map((s, idx) => (
                          <td key={idx} style={{ padding: '8px', textAlign: 'center', background: s.isBooked ? '#fee2e2' : '#dcfce7', color: s.isBooked ? '#dc2626' : '#15803d', fontWeight: '700' }}>
                            {s.isBooked ? `Đã đặt (${s.bookingCode || ''})` : 'Trống'}
                          </td>
                        ))
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            * Nhấp vào một ô sự kiện để xem chi tiết người đặt và trạng thái nhận phòng
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Đóng</button>
        </div>
      </div>

      {/* =========================================================================
          POPOVER CHI TIẾT SỰ KIỆN (Z-INDEX 9999 NỔI HOÀN TOÀN TRÊN TẤT CẢ)
         ========================================================================= */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: 'white', borderRadius: '12px', maxWidth: '380px', width: '100%',
              padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #cbd5e1'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#1e293b' }}>
                  Đơn mượn <span style={{ color: '#2563eb' }}>{selectedEvent.bookingCode}</span>
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                  Phòng: {selectedEvent.roomId} ({selectedEvent.roomName})
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '6px', padding: '4px', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                <Clock size={14} color="#2563eb" />
                <span>Thời gian: <strong>{selectedEvent.startTime} – {selectedEvent.endTime}</strong> ({selectedEvent.bookingDate})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                <Users size={14} color="#64748b" />
                <span>Người đặt: <strong>{selectedEvent.studentName}</strong> ({selectedEvent.studentId})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                <Building2 size={14} color="#64748b" />
                <span>Quy mô nhóm: {selectedEvent.groupSize} người</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                <CheckCircle2 size={14} color="#16a34a" />
                <span>
                  Trạng thái nhận phòng:{' '}
                  <strong>{selectedEvent.attendance?.checkIn?.status === 'CHECKED_IN' ? '✓ Đã nhận phòng' : '⏳ Chờ điểm danh'}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                width: '100%', padding: '0.6rem', borderRadius: '8px',
                border: 'none', background: '#1e3a8a', color: 'white',
                fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              Đóng chi tiết
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
