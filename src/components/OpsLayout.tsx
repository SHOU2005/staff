import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Layers, ShieldAlert, IndianRupee, Briefcase, Building2, Settings } from 'lucide-react';
import { getPayoutRequests, getGuaranteeAlerts } from '../lib/data';

const navItems = [
  { to:'/ops/dashboard', icon: LayoutDashboard, label:'Home'     },
  { to:'/ops/pipeline',  icon: Layers,          label:'Pipeline' },
  { to:'/ops/jobs',      icon: Briefcase,       label:'Jobs'     },
  { to:'/ops/owners',    icon: Building2,       label:'Owners'   },
  { to:'/ops/payouts',   icon: IndianRupee,     label:'Payouts'  },
  { to:'/ops/guarantee', icon: ShieldAlert,     label:'Risk'     },
];


export default function OpsLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pendingPayouts = getPayoutRequests().filter(r => r.status === 'pending').length;
  const criticalGuarantees = getGuaranteeAlerts().filter(g => g.daysLeft >= 0 && g.daysLeft <= 3).length;

  const badges: Record<string, number> = {
    '/ops/payouts':   pendingPayouts,
    '/ops/guarantee': criticalGuarantees,
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'var(--neutral-100)' }}>
      {/* Top bar */}
      <div style={{ height:56, padding:'0 16px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderBottom:'1px solid var(--neutral-200)', flexShrink:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg,#D4A017,#b87d12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, boxShadow:'0 2px 10px rgba(212,160,23,0.3)' }}>📊</div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'var(--neutral-900)', letterSpacing:'-0.02em', lineHeight:1.1 }}>Switch Ops</div>
            <div style={{ fontSize:9, color:'#D4A017', fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase' }}>Operations Team</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {pendingPayouts > 0 && (
            <div style={{ background:'rgba(124,58,237,0.1)', borderRadius:99, padding:'4px 10px', fontSize:11, fontWeight:700, color:'#7C3AED' }}>
              {pendingPayouts} payout{pendingPayouts>1?'s':''}
            </div>
          )}
          <button onClick={() => navigate('/ops/settings')} style={{ width:34, height:34, borderRadius:10, border:'1.5px solid var(--neutral-200)', background:'var(--neutral-50)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Settings size={16} color="var(--neutral-500)" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 80px', overscrollBehavior:'contain' }}>
        {children}
      </div>

      {/* Bottom nav */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, height:64, background:'#fff', borderTop:'1px solid var(--neutral-200)', display:'flex', justifyContent:'space-around', alignItems:'center', padding:'0 4px', zIndex:50, paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>
        {navItems.map(({ to, icon: Icon, label }) => {
          const badge = badges[to] || 0;
          return (
            <NavLink key={to} to={to} id={`nav-ops-${label.toLowerCase()}`} style={({ isActive }) => ({ display:'flex', flexDirection:'column', alignItems:'center', gap:3, textDecoration:'none', flex:1, padding:'6px 4px', color:isActive?'#D4A017':'var(--neutral-500)', fontSize:9, fontWeight:700, letterSpacing:'0.03em', textTransform:'uppercase', position:'relative', transition:'color 0.2s' })}>
              {({ isActive }) => (
                <>
                  <div style={{ position:'relative' }}>
                    <Icon size={19} strokeWidth={isActive?2.5:2} />
                    {badge > 0 && (
                      <span style={{ position:'absolute', top:-5, right:-7, minWidth:15, height:15, borderRadius:99, background:'var(--danger)', color:'#fff', fontSize:8, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #fff', padding:'0 3px' }}>{badge}</span>
                    )}
                  </div>
                  <span>{label}</span>
                  {isActive && <span style={{ position:'absolute', bottom:-2, width:4, height:4, borderRadius:'50%', background:'#D4A017' }} />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
