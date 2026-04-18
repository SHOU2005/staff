import { useState, useCallback, useEffect } from 'react';

import { LogOut, Edit2, ChevronRight, Shield, Phone, CreditCard, Award } from 'lucide-react';
import {
  getCaptains, getCaptainStats, getCaptainAchievements,
  getTierConfig, getTierLabel, getEarningRateForPlacementNumber,
  saveCaptains, changePassword, type Captain,
} from '../../lib/data';
import { useRole } from '../../contexts/RoleContext';
import toast from 'react-hot-toast';

export default function CaptainProfilePage() {
  const { captainId, captainName, clearRole, session } = useRole();
  const [stats, setStats] = useState<ReturnType<typeof getCaptainStats> | null>(null);
  const [achievements, setAchievements] = useState<ReturnType<typeof getCaptainAchievements>>([]);
  const [captain, setCaptain] = useState<Captain | null>(null);

  // Edit state
  const [editingUPI, setEditingUPI] = useState(false);
  const [newUPI, setNewUPI] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [oldPwd, setOldPwd]  = useState('');
  const [newPwd1, setNewPwd1]= useState('');
  const [newPwd2, setNewPwd2]= useState('');

  const load = useCallback(() => {
    setStats(getCaptainStats(captainId));
    setAchievements(getCaptainAchievements(captainId));
    const cap = getCaptains().find(c => c.id === captainId);
    setCaptain(cap || null);
    setNewUPI(cap?.upiId || '');
  }, [captainId]);

  useEffect(() => { load(); }, [load]);

  const tier    = getTierLabel(stats?.placements || 0);
  const tierCfg = getTierConfig(tier);
  const nextRate = getEarningRateForPlacementNumber((stats?.placements||0)+1);

  const handleSaveUPI = () => {
    const caps = getCaptains();
    const idx  = caps.findIndex(c => c.id === captainId);
    if (idx !== -1) { caps[idx].upiId = newUPI.trim(); saveCaptains(caps); }
    toast.success('UPI ID updated!');
    setEditingUPI(false);
    load();
  };

  const handleChangePassword = async () => {
    if (newPwd1 !== newPwd2) { toast.error('New passwords do not match'); return; }
    if (newPwd1.length < 6)  { toast.error('Password must be at least 6 characters'); return; }
    const result = await changePassword(session?.phone||'', oldPwd, newPwd1);
    if (!result.ok) { toast.error(result.error!); return; }
    toast.success('Password changed!');
    setChangingPwd(false);
    setOldPwd(''); setNewPwd1(''); setNewPwd2('');
  };

  const inputStyle = {
    width:'100%', height:48, padding:'12px 14px', borderRadius:12,
    border:'1.5px solid var(--neutral-200)', fontSize:14, fontFamily:'inherit',
    outline:'none', color:'var(--neutral-900)', background:'#fff', boxSizing:'border-box' as const,
  };

  const earnedCount = achievements.filter(a => a.earned).length;

  return (
    <div>
      {/* ── Profile hero ──────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg, var(--brand-green-dark), var(--brand-green))', borderRadius:22, padding:'24px 20px', marginBottom:16, textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
        <div style={{ width:72, height:72, borderRadius:22, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:28, fontWeight:900, color:'#fff', border:'2.5px solid rgba(255,255,255,0.3)', backdropFilter:'blur(8px)' }}>
          {captainName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
        </div>
        <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>{captainName}</div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:8, background:'rgba(255,255,255,0.15)', borderRadius:99, padding:'5px 14px' }}>
          <span style={{ fontSize:16 }}>{tierCfg.icon}</span>
          <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>{tier} Captain</span>
        </div>
        <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:16 }}>
          {[
            { l:'Placements', v:stats?.placements||0 },
            { l:'Earning Rate', v:`₹${nextRate}` },
            { l:'This Month', v:stats?.thisMonthPlacements||0 },
          ].map(({ l, v }) => (
            <div key={l}>
              <div style={{ fontSize:20, fontWeight:900, color:'#FDE68A', fontFamily:'DM Mono, monospace' }}>{v}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tier progression ──────────────────────────── */}
      <div style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:18, padding:16, marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--neutral-700)', marginBottom:12 }}>Tier Progression</div>
        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          {(['Bronze','Silver','Gold','Platinum'] as const).map(t => {
            const tc  = getTierConfig(t);
            const done = ['Bronze','Silver','Gold','Platinum'].indexOf(tier) >= ['Bronze','Silver','Gold','Platinum'].indexOf(t);
            const curr = tier === t;
            return (
              <div key={t} style={{ flex:1, textAlign:'center', padding:'10px 4px', borderRadius:12, background:done?tc.bg:'var(--neutral-100)', border:`1.5px solid ${curr?tc.color:'var(--neutral-200)'}` }}>
                <div style={{ fontSize:18, marginBottom:3 }}>{tc.icon}</div>
                <div style={{ fontSize:9, fontWeight:700, color:done?tc.color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{t}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize:12, color:'var(--neutral-600)' }}>
          {tier!=='Platinum' && `${['Bronze','Silver','Gold','Platinum'].indexOf(tier)<1?10-Math.min(stats?.placements||0,10):['Bronze','Silver','Gold','Platinum'].indexOf(tier)<2?30-Math.min(stats?.placements||0,30):60-Math.min(stats?.placements||0,60)} more placements to next tier`}
          {tier==='Platinum' && '🎉 Max tier reached!'}
        </div>
      </div>

      {/* ── Achievements ──────────────────────────────── */}
      <div style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:18, padding:16, marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--neutral-700)' }}>
            <Award size={14} style={{ display:'inline', marginRight:6, color:'var(--brand-green)' }} />
            Achievements
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--brand-green)' }}>{earnedCount}/{achievements.length}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {achievements.map(a => (
            <div key={a.id} title={a.desc} style={{
              padding:'10px 6px', borderRadius:12, textAlign:'center',
              background:a.earned?'var(--brand-green-light)':'var(--neutral-100)',
              border:`1.5px solid ${a.earned?'rgba(46,168,106,0.25)':'var(--neutral-200)'}`,
              opacity:a.earned?1:0.45,
            }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{a.icon}</div>
              <div style={{ fontSize:9, fontWeight:700, color:a.earned?'var(--brand-green)':'var(--neutral-500)', lineHeight:1.3 }}>{a.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Account details ───────────────────────────── */}
      <div style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:18, overflow:'hidden', marginBottom:14 }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--neutral-200)', fontSize:13, fontWeight:700, color:'var(--neutral-700)' }}>Account</div>

        {/* Phone */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--neutral-200)' }}>
          <Phone size={16} color="var(--neutral-500)" />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:'var(--neutral-500)', fontWeight:600, marginBottom:2 }}>Phone</div>
            <div style={{ fontSize:14, fontFamily:'DM Mono, monospace', color:'var(--neutral-900)' }}>{session?.phone?.replace(/(\d{5})(\d{5})/, '$1-$2')}</div>
          </div>
        </div>

        {/* UPI */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--neutral-200)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:editingUPI?10:0 }}>
            <CreditCard size={16} color="var(--neutral-500)" />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:'var(--neutral-500)', fontWeight:600, marginBottom:2 }}>UPI ID (for payouts)</div>
              <div style={{ fontSize:14, color:captain?.upiId?'var(--neutral-900)':'var(--neutral-500)', fontFamily:'DM Mono, monospace' }}>{captain?.upiId || 'Not set — tap to add'}</div>
            </div>
            <button onClick={() => setEditingUPI(!editingUPI)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--brand-green)' }}><Edit2 size={16}/></button>
          </div>
          {editingUPI && (
            <div style={{ display:'flex', gap:8 }}>
              <input value={newUPI} onChange={e=>setNewUPI(e.target.value)} placeholder="yourname@bank" style={{ ...inputStyle, flex:1, fontSize:13 }} onFocus={e=>{e.target.style.borderColor='var(--brand-green-mid)'}} onBlur={e=>{e.target.style.borderColor='var(--neutral-200)'}} />
              <button onClick={handleSaveUPI} style={{ flexShrink:0, padding:'0 16px', borderRadius:12, border:'none', background:'var(--brand-green-mid)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', height:48 }}>Save</button>
            </div>
          )}
        </div>

        {/* Change password */}
        <div style={{ padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:changingPwd?10:0 }}>
            <Shield size={16} color="var(--neutral-500)" />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--neutral-900)' }}>Change Password</div>
            </div>
            <button onClick={() => setChangingPwd(!changingPwd)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--brand-green)' }}><ChevronRight size={16}/></button>
          </div>
          {changingPwd && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { ph:'Current password', val:oldPwd, set:setOldPwd },
                { ph:'New password',     val:newPwd1, set:setNewPwd1 },
                { ph:'Confirm new',      val:newPwd2, set:setNewPwd2 },
              ].map(({ ph, val, set }) => (
                <input key={ph} type="password" value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={inputStyle} onFocus={e=>{e.target.style.borderColor='var(--brand-green-mid)'}} onBlur={e=>{e.target.style.borderColor='var(--neutral-200)'}} />
              ))}
              <button onClick={handleChangePassword} style={{ height:44, borderRadius:12, border:'none', background:'var(--brand-green-mid)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Update Password</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Support ───────────────────────────────────── */}
      <div style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:18, overflow:'hidden', marginBottom:14 }}>
        <a href="https://wa.me/919999999999?text=Hi%2C+I+need+help+with+Switch+Captain." target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', textDecoration:'none', borderBottom:'1px solid var(--neutral-200)' }}>
          <span style={{ fontSize:20 }}>💬</span>
          <div style={{ flex:1, fontSize:14, fontWeight:600, color:'var(--neutral-900)' }}>WhatsApp Support</div>
          <ChevronRight size={16} color="var(--neutral-500)" />
        </a>
        <button onClick={clearRole} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
          <LogOut size={16} color="var(--danger)" />
          <div style={{ fontSize:14, fontWeight:600, color:'var(--danger)' }}>Sign Out</div>
        </button>
      </div>

      <div style={{ height:8 }} />
    </div>
  );
}
