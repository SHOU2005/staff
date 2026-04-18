import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../contexts/RoleContext';
import {
  getCandidates, getCaptainStats, getLeaderboard, createPayoutRequest,
  getTierConfig, getEarningRateForPlacementNumber,
  type Candidate,
} from '../../lib/data';
import toast from 'react-hot-toast';



export default function CaptainEarningsPage() {
  const { captainId, captainName, captainUPI } = useRole();
  const navigate = useNavigate();
  const [stats, setStats]   = useState<ReturnType<typeof getCaptainStats> | null>(null);
  const [placed, setPlaced] = useState<Candidate[]>([]);
  const [lb, setLb]         = useState<ReturnType<typeof getLeaderboard>>([]);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(() => {
    setStats(getCaptainStats(captainId));
    const all = getCandidates().filter(c => c.referredBy === captainId && c.currentStage === 'Placed' && !c.archived);
    all.sort((a, b) => new Date(b.placedAt!).getTime() - new Date(a.placedAt!).getTime());
    setPlaced(all);
    setLb(getLeaderboard());
  }, [captainId]);

  useEffect(() => { load(); }, [load]);


  const pending  = placed.filter(c => c.payout.status === 'pending'||c.payout.status==='confirmed');
  const totalPending = pending.reduce((s,c) => s+c.payout.amount, 0);



  const handlePayout = async () => {
    if (!captainUPI) { toast.error('Add your UPI ID in profile first'); navigate('/captain/profile'); return; }
    setRequesting(true);
    const req = createPayoutRequest(captainId, captainName, captainUPI);
    setRequesting(false);
    if (!req) { toast.error('No pending payouts to request'); return; }
    toast.success('Payout request sent to Ops! ✓');
    load();
  };

  // Monthly chart data (6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const count  = placed.filter(c => c.placedAt && new Date(c.placedAt) >= mStart && new Date(c.placedAt) <= mEnd).length;
    return { month: d.toLocaleDateString('en-IN', { month: 'short' }), count };
  });
  const maxMonth = Math.max(...monthlyData.map(m => m.count), 1);

  const tierCfg = getTierConfig(stats?.tier || 'Bronze');

  const statusBadge = (s: string) =>
    s==='paid' ? {bg:'var(--success-light)',color:'var(--success)',label:'✅ Paid'} :
    s==='confirmed' ? {bg:'var(--warning-light)',color:'var(--warning)',label:'🕐 Requested'} :
    {bg:'rgba(107,114,128,0.1)',color:'#6B7280',label:'⏳ Pending'};

  return (
    <div>
      {/* ── Hero gold card ────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg, #78350f, #92400e, #b45309)', borderRadius:22, padding:'22px 18px', marginBottom:14, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-20, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Total earnings</div>
            <div style={{ fontSize:40, fontWeight:900, color:'#FDE68A', fontFamily:'DM Mono, monospace', lineHeight:1 }}>
              ₹{((stats?.totalEarned||0)+(stats?.pendingPayout||0)).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:12, padding:'8px 12px', textAlign:'center' }}>
            <div style={{ fontSize:22 }}>{tierCfg.icon}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.9)', fontWeight:800, textTransform:'uppercase', marginTop:2 }}>{stats?.tier}</div>
          </div>
        </div>
        <div style={{ height:1, background:'rgba(255,255,255,0.15)', marginBottom:14 }} />
        <div style={{ display:'flex', gap:20 }}>
          {[
            { l:'Paid out', v:`₹${(stats?.totalEarned||0).toLocaleString('en-IN')}` },
            { l:'Pending', v:`₹${(stats?.pendingPayout||0).toLocaleString('en-IN')}` },
            { l:'Next rate', v:`₹${getEarningRateForPlacementNumber((stats?.placements||0)+1)}/hire` },
          ].map(({ l, v }) => (
            <div key={l}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>{l}</div>
              <div style={{ fontSize:16, fontWeight:800, color:'#FDE68A', fontFamily:'DM Mono, monospace' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tiered earnings model ─────────────────────── */}
      <div style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:18, padding:16, marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--neutral-700)', marginBottom:12 }}>📊 Your Earning Tiers</div>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { label:'Hires 1–30',  rate:'₹300', active: (stats?.placements||0)<30, completed: (stats?.placements||0)>=30 },
            { label:'Hires 31–60', rate:'₹400', active: (stats?.placements||0)>=30 && (stats?.placements||0)<60, completed: (stats?.placements||0)>=60 },
            { label:'Hires 61+',   rate:'₹500', active: (stats?.placements||0)>=60, completed: false },
          ].map(({ label, rate, active, completed }) => (
            <div key={label} style={{
              flex:1, padding:'12px 8px', borderRadius:14, textAlign:'center',
              background: completed ? 'var(--success-light)' : active ? 'var(--brand-green-light)' : 'var(--neutral-100)',
              border: `1.5px solid ${completed ? 'rgba(5,150,105,0.25)' : active ? 'rgba(46,168,106,0.3)' : 'var(--neutral-200)'}`,
            }}>
              <div style={{ fontSize:15, fontWeight:900, fontFamily:'DM Mono, monospace', color: completed ? 'var(--success)' : active ? 'var(--brand-green)' : 'var(--neutral-500)' }}>{rate}</div>
              <div style={{ fontSize:9, color:'var(--neutral-500)', fontWeight:700, textTransform:'uppercase', marginTop:4, lineHeight:1.3 }}>{label}</div>
              {completed && <div style={{ fontSize:10, color:'var(--success)', marginTop:6 }}>✓ Done</div>}
              {active && <div style={{ fontSize:10, color:'var(--brand-green)', fontWeight:700, marginTop:6 }}>Current</div>}
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, padding:'10px 14px', borderRadius:12, background:'var(--neutral-50)', border:'1px solid var(--neutral-200)', fontSize:12, color:'var(--neutral-700)', lineHeight:1.5 }}>
          <b>Total placements:</b> {stats?.placements||0} · Next milestone at {(stats?.placements||0)<30?'30-hire Silver tier':(stats?.placements||0)<60?'60-hire Gold tier':'Platinum — max rate!'}
        </div>
      </div>

      {/* ── Monthly chart ─────────────────────────────── */}
      <div style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:18, padding:16, marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--neutral-700)', marginBottom:14 }}>📅 Monthly Placements</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:80 }}>
          {monthlyData.map((m, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--brand-green)', fontFamily:'DM Mono, monospace' }}>{m.count>0?m.count:''}</div>
              <div style={{ width:'100%', background:i===5?'var(--brand-green)':'var(--neutral-200)', borderRadius:'4px 4px 0 0', height:m.count>0?`${(m.count/maxMonth)*54 + 8}px`:'8px', minHeight:8, transition:'height 0.5s' }} />
              <div style={{ fontSize:10, color:'var(--neutral-500)', fontWeight:600 }}>{m.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Leaderboard ───────────────────────────────── */}
      <div style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:18, padding:16, marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--neutral-700)', marginBottom:12 }}>🏆 Leaderboard — This Month</div>
        {lb.slice(0,5).map((entry, i) => {
          const isMe = entry.captain.id === captainId;
          const tc2  = getTierConfig(entry.tier);
          return (
            <div key={entry.captain.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12, marginBottom:4, background:isMe?'var(--brand-green-light)':'transparent', border:isMe?'1.5px solid rgba(46,168,106,0.2)':'1.5px solid transparent' }}>
              <div style={{ fontSize:14, fontWeight:900, width:28, textAlign:'center', fontFamily:'DM Mono, monospace', color:i===0?'#D4A017':i===1?'#9CA3AF':i===2?'#CD7C4C':'var(--neutral-500)' }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
              <div style={{ flex:1, fontSize:14, fontWeight:isMe?700:500, color:isMe?'var(--brand-green-dark)':'var(--neutral-700)' }}>{isMe?`${entry.captain.name} (You)`:entry.captain.name}</div>
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:tc2.bg, color:tc2.color, fontWeight:700 }}>{tc2.icon} {entry.tier}</span>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--neutral-900)', fontFamily:'DM Mono, monospace', width:32, textAlign:'right' }}>{entry.thisMonth}</div>
            </div>
          );
        })}
      </div>

      {/* ── Payout breakdown ──────────────────────────── */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:800, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Placement History</div>
        {placed.length===0
          ? <div style={{ textAlign:'center', padding:32, color:'var(--neutral-500)', fontSize:14 }}>No placements yet — keep submitting!</div>
          : placed.map(c => {
            const badge = statusBadge(c.payout.status);
            const date  = c.placedAt ? new Date(c.placedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '—';
            return (
              <div key={c.id} style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:14, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--neutral-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'var(--neutral-500)', marginTop:2 }}>{c.location} · {c.jobType} · {date}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:'var(--neutral-900)', fontFamily:'DM Mono, monospace' }}>₹{c.payout.amount.toLocaleString('en-IN')}</div>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:badge.bg, color:badge.color }}>{badge.label}</span>
                </div>
              </div>
            );
          })
        }
      </div>

      {/* ── Request payout ────────────────────────────── */}
      {totalPending > 0 && (
        <button
          id="request-payout-btn"
          onClick={handlePayout}
          disabled={requesting}
          style={{ width:'100%', height:56, borderRadius:16, border:'none', background:'linear-gradient(135deg,#D4A017,#b87d12)', color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 24px rgba(212,160,23,0.35)', marginBottom:20, opacity:requesting?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}
        >
          {requesting ? '...' : `💰 Request ₹${totalPending.toLocaleString('en-IN')} Payout`}
        </button>
      )}
    </div>
  );
}
