import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, IndianRupee, User } from 'lucide-react';

// 4 nav items + center FAB slot
const NAV_LEFT  = [
  { to: '/captain/home',      icon: Home,        label: 'होम'       },
  { to: '/captain/community', icon: Users,        label: 'समुदाय'   },
];
const NAV_RIGHT = [
  { to: '/captain/earnings',  icon: IndianRupee,  label: 'कमाई'     },
  { to: '/captain/profile',   icon: User,         label: 'प्रोफाइल' },
];

export default function CaptainLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'var(--neutral-100)' }}>
      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 80px' }}>
        {children}
      </div>

      {/* Bottom nav — 5-column grid: left×2 | FAB | right×2 */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 64, background: '#fff',
        borderTop: '1px solid var(--neutral-200)',
        display: 'grid', gridTemplateColumns: '1fr 1fr 60px 1fr 1fr',
        alignItems: 'center', padding: '0 4px', zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {NAV_LEFT.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} id={`nav-${to.split('/').pop()}`}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              textDecoration: 'none', padding: '6px 4px',
              color: isActive ? 'var(--brand-green)' : 'var(--neutral-500)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
              position: 'relative', transition: 'color 0.2s',
            })}>
            {({ isActive }) => (
              <>
                <div style={{ position: 'relative' }}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span lang="hi">{label}</span>
                {isActive && <span style={{ position: 'absolute', bottom: -2, width: 4, height: 4, borderRadius: '50%', background: 'var(--brand-green)' }} />}
              </>
            )}
          </NavLink>
        ))}

        {/* Center FAB — opens post composer */}
        <button
          id="fab-compose"
          onClick={() => navigate('/captain/community/compose')}
          style={{
            width: 50, height: 50, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, var(--brand-green-mid), var(--brand-green))',
            color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(46,168,106,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto', transition: 'transform 0.15s',
          }}
          onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          ✏️
        </button>

        {NAV_RIGHT.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} id={`nav-${to.split('/').pop()}`}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              textDecoration: 'none', padding: '6px 4px',
              color: isActive ? 'var(--brand-green)' : 'var(--neutral-500)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
              position: 'relative', transition: 'color 0.2s',
            })}>
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span lang="hi">{label}</span>
                {isActive && <span style={{ position: 'absolute', bottom: -2, width: 4, height: 4, borderRadius: '50%', background: 'var(--brand-green)' }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
