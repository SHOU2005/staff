import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Plus, IndianRupee, User } from 'lucide-react';
import { getUnreadCount } from '../lib/data';
import LeadSubmissionModal from './LeadSubmissionModal';

const navItems = [
  { to: '/captain/home',     icon: Home,         label: 'Home' },
  { to: '/captain/leads',    icon: Users,         label: 'Leads' },
  { to: '/captain/earnings', icon: IndianRupee,   label: 'Earnings' },
  { to: '/captain/profile',  icon: User,          label: 'Profile' },
];

export default function CaptainLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [showFAB, setShowFAB] = useState(false);
  const unread = getUnreadCount('captain');

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'var(--neutral-100)' }}>
      {/* Top bar */}
      <div style={{ height:56, padding:'0 16px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderBottom:'1px solid var(--neutral-200)', flexShrink:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg,var(--brand-green-mid),var(--brand-green-dark))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, boxShadow:'0 2px 10px rgba(46,168,106,0.3)' }}>⚡</div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'var(--neutral-900)', letterSpacing:'-0.02em', lineHeight:1.1 }}>Switch Captain</div>
            <div style={{ fontSize:9, color:'var(--brand-green)', fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase' }}>Field Agent Platform</div>
          </div>
        </div>
        {/* Bell with badge */}
        <NavLink to="/captain/alerts" style={{ position:'relative', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, background:'var(--neutral-100)', borderRadius:10 }}>
          <span style={{ fontSize:18 }}>🔔</span>
          {unread > 0 && (
            <span style={{ position:'absolute', top:2, right:2, width:16, height:16, borderRadius:'50%', background:'var(--danger)', color:'#fff', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </NavLink>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 82px', overscrollBehavior:'contain' }}>
        {children}
      </div>

      {/* FAB */}
      <button
        id="fab-add-lead"
        onClick={() => setShowFAB(true)}
        style={{ position:'fixed', bottom:72, right:20, zIndex:40, width:56, height:56, borderRadius:'50%', border:'none', background:'linear-gradient(135deg,var(--brand-green-mid),var(--brand-green))', color:'#fff', cursor:'pointer', boxShadow:'0 4px 20px rgba(46,168,106,0.45)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, transition:'transform 0.2s' }}
        onPointerDown={e => e.currentTarget.style.transform='scale(0.9)'}
        onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
      >
        <Plus size={24} />
      </button>

      {/* Bottom nav */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, height:64, background:'#fff', borderTop:'1px solid var(--neutral-200)', display:'flex', justifyContent:'space-around', alignItems:'center', padding:'0 4px', zIndex:50, paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>
        {navItems.slice(0, 2).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} id={`nav-${label.toLowerCase()}`} style={({ isActive }) => ({ display:'flex', flexDirection:'column', alignItems:'center', gap:3, textDecoration:'none', flex:1, padding:'6px 4px', color:isActive?'var(--brand-green)':'var(--neutral-500)', fontSize:10, fontWeight:700, letterSpacing:'0.03em', textTransform:'uppercase', position:'relative', transition:'color 0.2s' })}>
            {({ isActive }) => (<><Icon size={20} strokeWidth={isActive?2.5:2} /><span>{label}</span>{isActive && <span style={{ position:'absolute', bottom:-2, width:4, height:4, borderRadius:'50%', background:'var(--brand-green)' }} />}</>)}
          </NavLink>
        ))}

        <div style={{ flex:1 }} />

        {navItems.slice(2).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} id={`nav-${label.toLowerCase()}`} style={({ isActive }) => ({ display:'flex', flexDirection:'column', alignItems:'center', gap:3, textDecoration:'none', flex:1, padding:'6px 4px', color:isActive?'var(--brand-green)':'var(--neutral-500)', fontSize:10, fontWeight:700, letterSpacing:'0.03em', textTransform:'uppercase', position:'relative', transition:'color 0.2s' })}>
            {({ isActive }) => (<><Icon size={20} strokeWidth={isActive?2.5:2} /><span>{label}</span>{isActive && <span style={{ position:'absolute', bottom:-2, width:4, height:4, borderRadius:'50%', background:'var(--brand-green)' }} />}</>)}
          </NavLink>
        ))}
      </nav>

      {showFAB && <LeadSubmissionModal onClose={() => setShowFAB(false)} onSuccess={() => { setShowFAB(false); navigate('/captain/leads'); }} />}
    </div>
  );
}
