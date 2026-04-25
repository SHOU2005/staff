import { type ReactNode, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Briefcase, IndianRupee, User } from 'lucide-react';
import { saveCaptainLocation } from '../lib/data';
import { useRole } from '../contexts/RoleContext';

const NAV_LEFT = [
  { to: '/captain/home',  icon: Home,     label: 'होम'    },
  { to: '/captain/leads', icon: Briefcase, label: 'लीड्स' },
];
const NAV_RIGHT = [
  { to: '/captain/earnings', icon: IndianRupee, label: 'कमाई'     },
  { to: '/captain/profile',  icon: User,        label: 'प्रोफाइल' },
];

const LOCATION_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export default function CaptainLayout({ children }: { children: ReactNode }) {
  const navigate  = useNavigate();
  const { captainId } = useRole();

  const pushLocation = useCallback(() => {
    if (!captainId || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => saveCaptainLocation(captainId, pos.coords.latitude, pos.coords.longitude),
      () => {},
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 },
    );
  }, [captainId]);

  useEffect(() => {
    // Request permission on first mount, then push silently
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    pushLocation();
    const interval = setInterval(pushLocation, LOCATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pushLocation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#F5F7FA' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 90px' }}>
        {children}
      </div>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 68,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.07)',
        display: 'grid', gridTemplateColumns: '1fr 1fr 68px 1fr 1fr',
        alignItems: 'center', padding: '0 4px', zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {NAV_LEFT.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} id={`nav-${to.split('/').pop()}`}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              textDecoration: 'none', padding: '8px 4px',
              color: isActive ? 'var(--brand-green-mid)' : 'var(--neutral-500)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
              position: 'relative', transition: 'color 0.2s',
            })}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 28, height: 3, borderRadius: '0 0 4px 4px',
                    background: 'var(--brand-green-mid)',
                  }} />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span lang="hi">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Center FAB — Add New Lead */}
        <button
          id="fab-add-lead"
          onClick={() => navigate('/captain/leads/new')}
          style={{
            width: 54, height: 54, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #2EA86A, #1A7A4A)',
            color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(46,168,106,0.5), 0 0 0 4px rgba(46,168,106,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', transition: 'transform 0.15s, box-shadow 0.15s',
            fontSize: 26, lineHeight: 1,
          }}
          onPointerDown={e => {
            e.currentTarget.style.transform = 'scale(0.88)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(46,168,106,0.35)';
          }}
          onPointerUp={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(46,168,106,0.5), 0 0 0 4px rgba(46,168,106,0.12)';
          }}
        >
          +
        </button>

        {NAV_RIGHT.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} id={`nav-${to.split('/').pop()}`}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              textDecoration: 'none', padding: '8px 4px',
              color: isActive ? 'var(--brand-green-mid)' : 'var(--neutral-500)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
              position: 'relative', transition: 'color 0.2s',
            })}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 28, height: 3, borderRadius: '0 0 4px 4px',
                    background: 'var(--brand-green-mid)',
                  }} />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span lang="hi">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
