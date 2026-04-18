import { useCallback, useEffect, useState } from 'react';
import { getGuaranteeAlerts, getSLAViolations, markReplacementNeeded } from '../../lib/data';
import toast from 'react-hot-toast';

export default function GuaranteePage() {
  const [alerts, setAlerts]     = useState<ReturnType<typeof getGuaranteeAlerts>>([]);
  const [sla, setSla]           = useState<ReturnType<typeof getSLAViolations>>([]);
  const [tab, setTab]           = useState<'guarantee' | 'sla'>('guarantee');

  const load = useCallback(() => {
    setAlerts(getGuaranteeAlerts());
    setSla(getSLAViolations());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReplacement = (id: string, name: string) => {
    markReplacementNeeded(id);
    toast.success(`Replacement pipeline created for ${name}`);
    load();
  };

  const critical   = alerts.filter(a => a.daysLeft >= 0 && a.daysLeft <= 3);
  const warning7   = alerts.filter(a => a.daysLeft > 3 && a.daysLeft <= 7);
  const active30   = alerts.filter(a => a.daysLeft > 7 && a.daysLeft <= 30);
  const expired    = alerts.filter(a => a.daysLeft < 0);

  const daysBar = (daysLeft: number) => {
    const total    = 30;
    const consumed = total - daysLeft;
    const pct      = Math.max(0, Math.min((consumed / total) * 100, 100));
    const color    = daysLeft < 0 ? '#9CA3AF' : daysLeft <= 3 ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--brand-green)';
    return { pct, color };
  };

  const GroupLabel = ({ label, count, color }: { label: string; count: number; color: string }) =>
    count > 0 ? (
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, marginTop:14 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:color }} />
        <span style={{ fontSize:11, fontWeight:800, color, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label} ({count})</span>
      </div>
    ) : null;

  const CandidateRow = ({ c }: { c: (typeof alerts)[0] }) => {
    const { pct, color } = daysBar(c.daysLeft);
    return (
      <div style={{ background:'#fff', border:`1.5px solid ${color === 'var(--danger)' ? 'rgba(220,38,38,0.2)' : color === 'var(--warning)' ? 'rgba(217,119,6,0.2)' : 'var(--neutral-200)'}`, borderRadius:16, padding:14, marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--neutral-900)' }}>{c.name}</div>
            <div style={{ fontSize:11, color:'var(--neutral-500)', marginTop:2 }}>👷 {c.captainName} · 📍 {c.location} · {c.jobType}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:22, fontWeight:900, fontFamily:'DM Mono, monospace', color, lineHeight:1 }}>{c.daysLeft < 0 ? '—' : c.daysLeft}</div>
            <div style={{ fontSize:10, color:'var(--neutral-500)', fontWeight:600 }}>{c.daysLeft < 0 ? 'Expired' : 'days left'}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:10 }}>
          <div style={{ height:6, background:'var(--neutral-200)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.5s' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style={{ fontSize:10, color:'var(--neutral-500)' }}>Placed {c.placedAt ? new Date(c.placedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '—'}</span>
            <span style={{ fontSize:10, color:'var(--neutral-500)' }}>Expires {c.guaranteeExpiresAt ? new Date(c.guaranteeExpiresAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '—'}</span>
          </div>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <a href={`tel:${c.mobile}`} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'rgba(46,168,106,0.1)', border:'1px solid rgba(46,168,106,0.2)', borderRadius:10, padding:'9px', fontSize:12, fontWeight:700, color:'var(--brand-green)', textDecoration:'none' }}>
            📞 Call
          </a>
          <a href={`https://wa.me/91${c.mobile}?text=${encodeURIComponent(`Hi ${c.name}! Switch टीम से हूँ — check-in करना था। कैसा चल रहा है नया काम? 😊`)}`} target="_blank" rel="noopener noreferrer" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'linear-gradient(135deg,#25D366,#128C7E)', borderRadius:10, padding:'9px', fontSize:12, fontWeight:700, color:'#fff', textDecoration:'none' }}>
            💬 WhatsApp
          </a>
          {!c.replacementNeeded && c.daysLeft >= 0 && c.daysLeft <= 7 && (
            <button onClick={() => handleReplacement(c.id, c.name)} style={{ flex:1, background:'var(--danger-light)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'9px', fontSize:12, fontWeight:700, color:'var(--danger)', cursor:'pointer', fontFamily:'inherit' }}>
              Replace
            </button>
          )}
          {c.replacementNeeded && (
            <span style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--warning)', background:'var(--warning-light)', borderRadius:10 }}>🔁 Creating...</span>
          )}
        </div>
      </div>
    );
  };

  const SLARow = ({ c }: { c: ReturnType<typeof getSLAViolations>[0] }) => (
    <div style={{ background:'#fff', border:'1.5px solid rgba(220,38,38,0.2)', borderRadius:16, padding:14, marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--neutral-900)' }}>{c.name}</div>
          <div style={{ fontSize:11, color:'var(--neutral-500)', marginTop:2 }}>👷 {c.captainName} · {c.currentStage}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:22, fontWeight:900, fontFamily:'DM Mono, monospace', color:'var(--danger)' }}>{c.daysInStage}d</div>
          <div style={{ fontSize:10, color:'var(--neutral-500)' }}>in stage</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <a href={`tel:${c.mobile}`} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, background:'rgba(46,168,106,0.1)', border:'1px solid rgba(46,168,106,0.2)', borderRadius:10, padding:'9px', fontSize:12, fontWeight:700, color:'var(--brand-green)', textDecoration:'none' }}>📞 Call</a>
        <a href={`https://wa.me/91${c.mobile}`} target="_blank" rel="noopener noreferrer" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, background:'linear-gradient(135deg,#25D366,#128C7E)', borderRadius:10, padding:'9px', fontSize:12, fontWeight:700, color:'#fff', textDecoration:'none' }}>💬 WhatsApp</a>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, fontWeight:800, color:'var(--danger)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>Risk Management</div>
        <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'var(--neutral-900)', letterSpacing:'-0.03em' }}>Guarantee Tracker</h1>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
        {[
          { l:'Critical', v:critical.length,  color:'var(--danger)',   bg:'var(--danger-light)' },
          { l:'Warning',  v:warning7.length,   color:'var(--warning)',  bg:'var(--warning-light)' },
          { l:'Active',   v:active30.length,   color:'var(--success)',  bg:'var(--success-light)' },
          { l:'SLA',      v:sla.length,        color:'var(--danger)',   bg:'var(--danger-light)' },
        ].map(({ l, v, color, bg }) => (
          <div key={l} style={{ background:bg, borderRadius:14, padding:'12px 8px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:900, color, fontFamily:'DM Mono, monospace' }}>{v}</div>
            <div style={{ fontSize:9, color:'var(--neutral-500)', fontWeight:700, textTransform:'uppercase', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div style={{ display:'flex', background:'var(--neutral-100)', borderRadius:12, padding:4, marginBottom:16 }}>
        {(['guarantee','sla'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex:1, padding:'9px', borderRadius:9, border:'none', cursor:'pointer',
            fontFamily:'inherit', fontSize:12, fontWeight:700,
            background:tab===t?'#fff':'transparent',
            color:tab===t?'var(--neutral-900)':'var(--neutral-500)',
            boxShadow:tab===t?'0 1px 4px rgba(0,0,0,0.08)':'none',
          }}>
            {t==='guarantee' ? `⚠️ Guarantee (${alerts.length})` : `🔴 SLA Alerts (${sla.length})`}
          </button>
        ))}
      </div>

      {tab === 'guarantee' && (
        <>
          <GroupLabel label="Critical (≤ 3 days)" count={critical.length} color="var(--danger)" />
          {critical.map(c => <CandidateRow key={c.id} c={c} />)}
          <GroupLabel label="Warning (4–7 days)" count={warning7.length} color="var(--warning)" />
          {warning7.map(c => <CandidateRow key={c.id} c={c} />)}
          <GroupLabel label="Active (8–30 days)" count={active30.length} color="var(--brand-green)" />
          {active30.map(c => <CandidateRow key={c.id} c={c} />)}
          <GroupLabel label="Expired" count={expired.length} color="#9CA3AF" />
          {expired.map(c => <CandidateRow key={c.id} c={c} />)}
          {alerts.length === 0 && <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--neutral-500)' }}><div style={{ fontSize:32, marginBottom:10 }}>✅</div>No guarantee alerts</div>}
        </>
      )}

      {tab === 'sla' && (
        <>
          {sla.length === 0
            ? <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--neutral-500)' }}><div style={{ fontSize:32, marginBottom:10 }}>🎯</div>No SLA violations!</div>
            : sla.map(c => <SLARow key={c.id} c={c} />)
          }
        </>
      )}
    </div>
  );
}
