import { useState } from 'react';
import { useRole } from '../contexts/RoleContext';

export default function RoleSelectorPage() {
  const { setRole } = useRole();
  const [selected, setSelected] = useState<'captain' | 'ops' | null>(null);

  const handleSelect = (r: 'captain' | 'ops') => {
    setSelected(r);
    setTimeout(() => setRole(r), 350);
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      background: 'linear-gradient(160deg, #0a1f14 0%, #0d2818 40%, #071510 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,122,74,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-5%', left: '-10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,168,106,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'linear-gradient(135deg, #2EA86A, #1A7A4A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 40px rgba(46,168,106,0.4)',
          fontSize: 36,
        }}>
          ⚡
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>
          Switch Captain
        </h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: 500 }}>
          Gurgaon's #1 Blue-Collar Hiring Platform
        </p>
      </div>

      {/* Role cards */}
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
          Who are you?
        </p>

        <button
          id="role-captain-btn"
          onClick={() => handleSelect('captain')}
          style={{
            background: selected === 'captain'
              ? 'linear-gradient(135deg, rgba(46,168,106,0.3), rgba(26,122,74,0.2))'
              : 'rgba(255,255,255,0.04)',
            border: selected === 'captain' ? '2px solid #2EA86A' : '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '20px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            transform: selected === 'captain' ? 'scale(0.98)' : 'scale(1)',
            fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(46,168,106,0.2), rgba(26,122,74,0.1))',
            border: '1.5px solid rgba(46,168,106,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>
            👷
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              I'm a Captain
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
              Field agent · Submit leads · Track earnings
            </div>
          </div>
          {selected === 'captain' && (
            <div style={{ marginLeft: 'auto', color: '#2EA86A', fontSize: 20 }}>✓</div>
          )}
        </button>

        <button
          id="role-ops-btn"
          onClick={() => handleSelect('ops')}
          style={{
            background: selected === 'ops'
              ? 'linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.1))'
              : 'rgba(255,255,255,0.04)',
            border: selected === 'ops' ? '2px solid #D4A017' : '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '20px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            transform: selected === 'ops' ? 'scale(0.98)' : 'scale(1)',
            fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.1))',
            border: '1.5px solid rgba(212,160,23,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>
            📊
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              I'm from Ops
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
              Switch team · Manage pipeline · View analytics
            </div>
          </div>
          {selected === 'ops' && (
            <div style={{ marginLeft: 'auto', color: '#D4A017', fontSize: 20 }}>✓</div>
          )}
        </button>
      </div>

      <p style={{ marginTop: 32, color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center' }}>
        You can change this later in Settings
      </p>
    </div>
  );
}
