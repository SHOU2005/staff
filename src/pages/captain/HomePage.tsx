import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, Share2, Target, Plus, Users, Bell, Phone, MessageCircle } from 'lucide-react';
import {
  getCandidates, getJobs, getCaptainStats, getLeaderboard, getCaptainAchievements,
  getTierConfig, getTierLabel, getEarningRateForPlacementNumber,
  checkFollowUpReminders, requestNotificationPermission, getFollowUpsDue,
  setLeadExtra, getTomorrowsJoinings, buildConfirmationMessage, getCaptains,
  type Candidate, type Job, type LeadExtra,
  getInitials, timeAgo,
} from '../../lib/data';
import { useRole } from '../../contexts/RoleContext';

const STAGE_COLORS: Record<string, string> = {
  Sourced:'#6B7280', Screening:'#2563EB', Interviewed:'#D97706', Offered:'#7C3AED', Placed:'#059669',
};

export default function CaptainHomePage() {
  const { captainName, captainId } = useRole();
  const navigate = useNavigate();
  const [stats, setStats]              = useState<ReturnType<typeof getCaptainStats> | null>(null);
  const [recent, setRecent]            = useState<Candidate[]>([]);
  const [jobs, setJobs]                = useState<Job[]>([]);
  const [lb, setLb]                    = useState<ReturnType<typeof getLeaderboard>>([]);
  const [achievements, setAchievements]= useState<ReturnType<typeof getCaptainAchievements>>([]);
  const [followUpsDue, setFollowUpsDue]= useState<ReturnType<typeof getFollowUpsDue>>([]);
  const [tomorrowJoinings, setTomorrowJoinings] = useState<Array<Candidate & { extra: LeadExtra }>>([]);
  const [locationLive, setLocationLive]= useState(false);

  const load = useCallback(() => {
    const s = getCaptainStats(captainId);
    setStats(s);
    const all = getCandidates().filter(c => c.referredBy === captainId && !c.archived);
    all.sort((a, b) => {
      const la = a.timeline[a.timeline.length-1]?.movedAt || a.submittedAt;
      const lb = b.timeline[b.timeline.length-1]?.movedAt || b.submittedAt;
      return new Date(lb).getTime() - new Date(la).getTime();
    });
    setRecent(all.slice(0, 5));
    setJobs(getJobs().filter(j => j.active));
    setLb(getLeaderboard());
    setAchievements(getCaptainAchievements(captainId));
    setFollowUpsDue(getFollowUpsDue(captainId));
    setTomorrowJoinings(getTomorrowsJoinings(captainId));
    const cap = getCaptains().find(c => c.id === captainId);
    const live = cap?.lastLocation ? (Date.now() - new Date(cap.lastLocation.updatedAt).getTime()) < 2 * 60 * 60 * 1000 : false;
    setLocationLive(live);
  }, [captainId]);

  useEffect(() => {
    load();
    requestNotificationPermission();
    checkFollowUpReminders(captainId);
  }, [load, captainId]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Good morning';
    if (h < 17) return '☀️ Good afternoon';
    return '🌙 Good evening';
  };

  const tier       = getTierLabel(stats?.placements || 0);
  const tierCfg    = getTierConfig(tier);
  const monthTarget= 5;
  const progress   = Math.min(((stats?.thisMonthPlacements || 0) / monthTarget) * 100, 100);
  const myRank     = lb.findIndex(l => l.captain.id === captainId);
  const nextRate   = getEarningRateForPlacementNumber((stats?.placements || 0) + 1);
  const toNextTier = tier === 'Bronze' ? 10 - (stats?.placements||0) :
                     tier === 'Silver' ? 30 - (stats?.placements||0) :
                     tier === 'Gold'   ? 60 - (stats?.placements||0) : null;

  const shareJob = (job: Job) => {
    const text = `🎯 नौकरी का मौका!\nPost: ${job.role}\n📍 ${job.location}, Gurgaon\n💰 ${job.salaryRange}\n\nInterested? Call/WhatsApp करें।\n— Switch Hiring Team`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div>
      {/* ── Hero card ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-green-dark) 0%, var(--brand-green) 100%)',
        borderRadius: 22, padding: '20px 18px', marginBottom: 14, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-30, right:-20, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:10, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', fontWeight:600, marginBottom:2 }}>{greeting()}</div>
            <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.03em' }}>{captainName || 'Captain'}</div>
          </div>
          {/* Tier + location badges */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
            <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'8px 12px', textAlign:'center', backdropFilter:'blur(4px)' }}>
              <div style={{ fontSize:22 }}>{tierCfg.icon}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.9)', fontWeight:800, marginTop:2, textTransform:'uppercase' }}>{tier}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4, background: locationLive ? 'rgba(5,150,105,0.3)' : 'rgba(255,255,255,0.1)', borderRadius:99, padding:'4px 8px' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background: locationLive ? '#4ADE80' : 'rgba(255,255,255,0.4)', flexShrink:0 }} />
              <span style={{ fontSize:9, fontWeight:800, color: locationLive ? '#4ADE80' : 'rgba(255,255,255,0.5)', letterSpacing:'0.06em' }}>
                {locationLive ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Key numbers */}
        <div style={{ display:'flex', gap:16, marginBottom:14 }}>
          <div>
            <div style={{ fontSize:32, fontWeight:900, color:'#fff', fontFamily:'DM Mono, monospace', lineHeight:1 }}>{stats?.thisMonthPlacements||0}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:3 }}>placements this month</div>
          </div>
          <div style={{ width:1, background:'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ fontSize:32, fontWeight:900, color:'#D4A017', fontFamily:'DM Mono, monospace', lineHeight:1 }}>
              ₹{((stats?.monthEarned||0)+(stats?.monthPending||0)).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:3 }}>earned this month</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>Monthly target</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.85)', fontWeight:700 }}>{stats?.thisMonthPlacements||0}/{monthTarget}</span>
          </div>
          <div style={{ height:6, background:'rgba(255,255,255,0.2)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress}%`, borderRadius:3, background:'#D4A017', transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>

        {/* Next earning rate */}
        {toNextTier !== null && toNextTier > 0 && (
          <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 12px', fontSize:12, color:'rgba(255,255,255,0.9)', fontWeight:600 }}>
            <TrendingUp size={12} style={{ display:'inline', marginRight:6 }} />
            {toNextTier} more hire{toNextTier>1?'s':''} → unlock <b>₹{nextRate > 300 ? nextRate : (tier==='Bronze'?400:500)}/hire</b> 🚀
          </div>
        )}
      </div>

      {/* ── Quick stats row ────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Active',    value:stats?.activePipeline||0,                                  color:'var(--brand-green-mid)', bg:'var(--brand-green-light)' },
          { label:'Pending ₹', value:`₹${((stats?.pendingPayout||0)/1000).toFixed(1)}k`,        color:'#D4A017',                bg:'var(--accent-gold-light)' },
          { label:'SLA Alert', value:stats?.slaCandidates?.length||0,                           color:(stats?.slaCandidates?.length||0)>0?'var(--danger)':'var(--neutral-500)', bg:(stats?.slaCandidates?.length||0)>0?'var(--danger-light)':'var(--neutral-100)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background:bg, borderRadius:16, padding:'14px 10px', textAlign:'center', border:'1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:20, fontWeight:900, color, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:10, color:'var(--neutral-500)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Tomorrow's Joinings banner ─────────────────── */}
      {tomorrowJoinings.length > 0 && (
        <div style={{ background:'linear-gradient(135deg,rgba(37,211,102,0.1),rgba(37,211,102,0.04))', border:'1.5px solid rgba(37,211,102,0.3)', borderRadius:18, padding:'14px 16px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'#059669', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>Action Needed</div>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--neutral-900)' }}>
                {tomorrowJoinings.length} joining tomorrow 🎉
              </div>
            </div>
            {tomorrowJoinings.length > 1 && (
              <button
                onClick={() => tomorrowJoinings.forEach((c, i) => setTimeout(() => {
                  const msg = buildConfirmationMessage(c, c.extra);
                  window.open(`https://wa.me/91${c.mobile}?text=${encodeURIComponent(msg)}`, '_blank');
                }, i * 600))}
                style={{ background:'linear-gradient(135deg,#25D366,#128C7E)', borderRadius:10, padding:'8px 13px', border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}
              >
                Send All
              </button>
            )}
          </div>
          {tomorrowJoinings.map(c => {
            const msg = buildConfirmationMessage(c, c.extra);
            return (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.7)', borderRadius:12, padding:'10px 12px', marginBottom:6 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--neutral-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'var(--neutral-500)', marginTop:1 }}>{c.jobType} · {c.extra.reportingTime ? '⏰ ' + c.extra.reportingTime : c.location}</div>
                </div>
                <a
                  href={`https://wa.me/91${c.mobile}?text=${encodeURIComponent(msg)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:5, background:'linear-gradient(135deg,#25D366,#128C7E)', borderRadius:9, padding:'8px 12px', fontSize:12, fontWeight:700, color:'#fff', textDecoration:'none', flexShrink:0 }}
                >
                  📱 Confirm
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {/* Add Lead — primary CTA */}
        <button
          onClick={() => navigate('/captain/leads/new')}
          style={{
            gridColumn:'span 2',
            height:52, borderRadius:14, border:'none',
            background:'linear-gradient(135deg, #2EA86A, #1A7A4A)',
            color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer',
            fontFamily:'inherit',
            boxShadow:'0 4px 20px rgba(46,168,106,0.38)',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            transition:'transform 0.15s',
          }}
          onPointerDown={e => e.currentTarget.style.transform='scale(0.98)'}
          onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
        >
          <Plus size={18} strokeWidth={2.5} /> Add New Lead
        </button>

        {/* My Leads */}
        <button
          onClick={() => navigate('/captain/leads')}
          style={{
            height:48, borderRadius:14, border:'1.5px solid var(--neutral-200)',
            background:'#fff', color:'var(--neutral-800)', fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', justifyContent:'center', gap:7,
            transition:'all 0.2s',
          }}
          onPointerDown={e => { e.currentTarget.style.borderColor='var(--brand-green-mid)'; e.currentTarget.style.color='var(--brand-green)'; }}
          onPointerUp={e => { e.currentTarget.style.borderColor='var(--neutral-200)'; e.currentTarget.style.color='var(--neutral-800)'; }}
        >
          <Users size={14} /> My Leads
        </button>

        {/* Community */}
        <button
          onClick={() => navigate('/captain/community')}
          style={{
            height:48, borderRadius:14, border:'1.5px solid var(--neutral-200)',
            background:'#fff', color:'var(--neutral-800)', fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', justifyContent:'center', gap:7,
            transition:'all 0.2s',
          }}
          onPointerDown={e => { e.currentTarget.style.borderColor='var(--brand-green-mid)'; e.currentTarget.style.color='var(--brand-green)'; }}
          onPointerUp={e => { e.currentTarget.style.borderColor='var(--neutral-200)'; e.currentTarget.style.color='var(--neutral-800)'; }}
        >
          <Bell size={14} /> Community
        </button>
      </div>

      {/* ── Follow-ups due today ──────────────────────── */}
      {followUpsDue.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{
            background: followUpsDue.some(c => c.overdue)
              ? 'linear-gradient(135deg, #FEF2F2, #FFF5F5)'
              : 'linear-gradient(135deg, #FFFBEB, #FEFCE8)',
            border: `1.5px solid ${followUpsDue.some(c => c.overdue) ? 'rgba(220,38,38,0.2)' : 'rgba(217,119,6,0.25)'}`,
            borderRadius:18, overflow:'hidden',
          }}>
            <div style={{ padding:'12px 16px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:18 }}>{followUpsDue.some(c => c.overdue) ? '⏰' : '📞'}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color: followUpsDue.some(c => c.overdue) ? 'var(--danger)' : '#B45309' }}>
                    {followUpsDue.some(c => c.overdue) ? 'Overdue follow-ups' : "Today's follow-ups"}
                  </div>
                  <div style={{ fontSize:11, color:'var(--neutral-500)', marginTop:1 }}>
                    {followUpsDue.length} candidate{followUpsDue.length > 1 ? 's' : ''} need a call
                  </div>
                </div>
              </div>
            </div>
            {followUpsDue.map(c => (
              <div key={c.id} style={{ padding:'10px 16px', borderTop:'1px solid rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:10 }}>
                <div onClick={() => navigate(`/captain/leads/${c.id}`)} style={{ flex:1, minWidth:0, cursor:'pointer' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--neutral-900)' }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'var(--neutral-500)', marginTop:1 }}>{c.currentStage} · {c.jobType} · {c.location}</div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <a href={`tel:${c.mobile}`} style={{ width:34, height:34, borderRadius:10, background:'rgba(46,168,106,0.12)', border:'1px solid rgba(46,168,106,0.2)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}>
                    <Phone size={14} color="var(--brand-green)" />
                  </a>
                  <a href={`https://wa.me/91${c.mobile}?text=${encodeURIComponent(`Hi ${c.name}! Switch Hiring Team हूँ। आपसे बात करनी थी।`)}`} target="_blank" rel="noreferrer" style={{ width:34, height:34, borderRadius:10, background:'rgba(37,211,102,0.12)', border:'1px solid rgba(37,211,102,0.2)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}>
                    <MessageCircle size={14} color="#25D366" />
                  </a>
                  <button
                    onClick={() => {
                      const d = new Date(); d.setDate(d.getDate() + 1);
                      setLeadExtra(c.id, { followUpDate: d.toISOString().split('T')[0] });
                      setFollowUpsDue(getFollowUpsDue(captainId));
                    }}
                    style={{ height:34, padding:'0 10px', borderRadius:10, border:'1.5px solid var(--neutral-200)', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, color:'var(--neutral-600)', fontFamily:'inherit', whiteSpace:'nowrap' }}
                  >
                    +1 day
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Leaderboard teaser ────────────────────────── */}
      {myRank >= 0 && (
        <div
          onClick={() => navigate('/captain/earnings')}
          style={{
            background:'linear-gradient(135deg, rgba(212,160,23,0.08), rgba(212,160,23,0.04))',
            border:'1.5px solid rgba(212,160,23,0.2)', borderRadius:16, padding:'14px 16px', marginBottom:16,
            display:'flex', alignItems:'center', gap:12, cursor:'pointer',
          }}
        >
          <span style={{ fontSize:28 }}>🏆</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#D4A017' }}>Rank #{myRank+1} this month</div>
            <div style={{ fontSize:12, color:'var(--neutral-500)', marginTop:2 }}>{lb[myRank]?.thisMonth||0} placements · {lb[myRank]?.tier} Captain</div>
          </div>
          <ChevronRight size={18} color="#D4A017" />
        </div>
      )}

      {/* ── Achievements strip ────────────────────────── */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Achievements</div>
        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
          {achievements.map(a => (
            <div key={a.id} style={{
              flexShrink:0, width:90, background:a.earned ? '#fff' : 'var(--neutral-100)',
              border:`1.5px solid ${a.earned ? 'rgba(46,168,106,0.3)' : 'var(--neutral-200)'}`,
              borderRadius:14, padding:'12px 8px', textAlign:'center',
              opacity:a.earned?1:0.5, position:'relative', overflow:'hidden',
            }}>
              {a.earned && <div style={{ position:'absolute', top:4, right:4, width:8, height:8, borderRadius:'50%', background:'var(--brand-green)' }} />}
              <div style={{ fontSize:22, marginBottom:4 }}>{a.icon}</div>
              <div style={{ fontSize:10, fontWeight:700, color: a.earned?'var(--neutral-900)':'var(--neutral-500)', lineHeight:1.3 }}>{a.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent activity ───────────────────────────── */}
      {recent.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Recent Activity</div>
            <button onClick={() => navigate('/captain/leads')} style={{ fontSize:12, color:'var(--brand-green-mid)', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>See all →</button>
          </div>
          {recent.map(c => {
            const last  = c.timeline[c.timeline.length-1];
            const sColor= STAGE_COLORS[c.currentStage]||'#6B7280';
            return (
              <div key={c.id} onClick={() => navigate(`/captain/leads/${c.id}`)} style={{ display:'flex', alignItems:'center', gap:12, background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:14, padding:'12px 14px', marginBottom:8, cursor:'pointer' }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'var(--brand-green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'var(--brand-green)', flexShrink:0 }}>{getInitials(c.name)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--neutral-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'var(--neutral-500)', marginTop:2 }}>→ {c.currentStage} · {timeAgo(last?.movedAt||c.submittedAt)}</div>
                </div>
                <span style={{ padding:'3px 9px', borderRadius:99, fontSize:10, fontWeight:700, background:`${sColor}18`, color:sColor, flexShrink:0 }}>{c.currentStage}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Job openings ──────────────────────────────── */}
      {jobs.length > 0 && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Active Jobs to Share</div>
            <Target size={14} color="var(--neutral-500)" />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {jobs.map(job => (
              <div key={job.id} style={{ background:'var(--neutral-50)', border:'1px solid var(--neutral-200)', borderRadius:16, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'var(--neutral-900)' }}>{job.role}</div>
                    <div style={{ fontSize:12, color:'var(--neutral-500)', marginTop:2 }}>📍 {job.location} · 🔢 {job.openings - job.filled} open</div>
                  </div>
                  <span style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:700, background:job.urgency==='high'?'var(--danger-light)':job.urgency==='medium'?'var(--warning-light)':'var(--success-light)', color:job.urgency==='high'?'var(--danger)':job.urgency==='medium'?'var(--warning)':'var(--success)' }}>{job.urgency.toUpperCase()}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--brand-green)', fontFamily:'DM Mono, monospace' }}>{job.salaryRange}</div>
                  <button onClick={() => shareJob(job)} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(46,168,106,0.1)', border:'1px solid rgba(46,168,106,0.2)', borderRadius:8, padding:'7px 14px', cursor:'pointer', fontSize:12, fontWeight:700, color:'var(--brand-green)', fontFamily:'inherit' }}>
                    <Share2 size={12}/> Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
