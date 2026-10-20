import { useState } from 'react';
import { Calendar } from 'lucide-react';

export default function Navbar({ currentPage, onNavigate, onOpenSchedule }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: '#1e3a8a',
      zIndex: 900,
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo + Brand */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
          onClick={() => onNavigate('home')}
        >
          <img
            src="/iu-logo.png"
            alt="IU Logo"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.5)',
              objectFit: 'cover',
              background: 'white',
              padding: '1px',
            }}
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div style={{
            display: 'none',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.6)',
            background: 'white',
            color: '#1e3a8a',
            fontWeight: '900',
            fontSize: '0.9rem',
            alignItems: 'center',
            justifyContent: 'center',
          }}>IU</div>
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', lineHeight: 1.1 }}>
              IURoomPeek
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', lineHeight: 1 }}>
              Hệ thống đặt phòng IU
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <NavLink
            active={currentPage === 'home'}
            onClick={() => onNavigate('home')}
          >
            Trang chủ
          </NavLink>
          <NavLink
            active={currentPage === 'rooms'}
            onClick={() => onNavigate('rooms')}
          >
            Phòng trống
          </NavLink>
          <button
            className="btn btn-sm"
            onClick={onOpenSchedule}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              gap: '6px',
              marginLeft: '0.5rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Calendar size={15} />
            Lịch phòng
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '0.45rem 1rem',
        fontSize: '0.9rem',
        fontWeight: active ? '700' : '500',
        cursor: 'pointer',
        transition: 'background 0.15s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => { if (!active) e.target.style.background = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={e => { if (!active) e.target.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}
