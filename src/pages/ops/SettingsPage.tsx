import { useState } from 'react';
import { LogOut, ChevronRight } from 'lucide-react';
import { getSettings, saveSettings, getCaptains, saveCaptains, getCandidates, type Settings, type Captain } from '../../lib/data';
import { useRole } from '../../contexts/RoleContext';
import toast from 'react-hot-toast';

function Section({ id, title, activeId, onToggle, children }: { id: string; title: string; activeId: string | null; onToggle: (id: string) => void; children: React.ReactNode }) {
  const isActive = activeId === id;
  return (
    <div style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:18, overflow:'hidden', marginBottom:12 }}>
      <button onClick={() => onToggle(id)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        <span style={{ fontSize:14, fontWeight:700, color:'var(--neutral-900)' }}>{title}</span>
        <ChevronRight size={16} color="var(--neutral-500)" style={{ transform: isActive ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }} />
      </button>
      {isActive && <div style={{ borderTop:'1px solid var(--neutral-200)', padding:16 }}>{children}</div>}
    </div>
  );
}

export default function OpsSettingsPage() {
  const { clearRole, captainName } = useRole();
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [captains, setCaptains] = useState<Captain[]>(getCaptains());
  const [newJobType, setNewJobType] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCaptainName, setNewCaptainName] = useState('');
  const [newCaptainMobile, setNewCaptainMobile] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSaveSettings = () => {
    saveSettings(settings);
    toast.success('Settings saved!');
  };

  const addJobType = () => {
    if (!newJobType.trim()) return;
    const updated = { ...settings, jobTypes: [...settings.jobTypes, newJobType.trim()] };
    setSettings(updated); setNewJobType(''); saveSettings(updated);
  };
  const removeJobType = (jt: string) => {
    const updated = { ...settings, jobTypes: settings.jobTypes.filter(j => j !== jt) };
    setSettings(updated); saveSettings(updated);
  };
  const addLocation = () => {
    if (!newLocation.trim()) return;
    const updated = { ...settings, locations: [...settings.locations, newLocation.trim()] };
    setSettings(updated); setNewLocation(''); saveSettings(updated);
  };
  const removeLocation = (loc: string) => {
    const updated = { ...settings, locations: settings.locations.filter(l => l !== loc) };
    setSettings(updated); saveSettings(updated);
  };
  const addCaptain = () => {
    if (!newCaptainName.trim() || !newCaptainMobile.trim()) return;
    const newCap: Captain = { id: `captain_${Date.now()}`, name: newCaptainName.trim(), mobile: newCaptainMobile.trim(), upiId: '', joinedAt: new Date().toISOString().split('T')[0], active: true };
    const updated = [...captains, newCap];
    setCaptains(updated); saveCaptains(updated); setNewCaptainName(''); setNewCaptainMobile('');
    toast.success('Captain added!');
  };
  const toggleCaptainActive = (id: string) => {
    const updated = captains.map(c => c.id === id ? { ...c, active: !c.active } : c);
    setCaptains(updated); saveCaptains(updated);
    toast.success('Captain status updated locally');
  };
  const exportCSV = () => {
    const candidates = getCandidates();
    const captainMap: Record<string,string> = {};
    getCaptains().forEach(c => { captainMap[c.id] = c.name; });
    const headers = 'Name,Mobile,Job Type,Location,Stage,Captain,Submitted,Placed,Payout Status,Payout (₹)';
    const rows = candidates.map(c =>
      `"${c.name}","${c.mobile}","${c.jobType}","${c.location}","${c.currentStage}","${captainMap[c.referredBy]||c.referredBy}","${c.submittedAt.split('T')[0]}","${c.placedAt||''}","${c.payout.status}","${c.payout.amount}"`
    );
    const csv = [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `switch_pipeline_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`${candidates.length} records exported!`);
  };

  const inputStyle = {
    width:'100%', height:46, padding:'11px 14px', borderRadius:12,
    border:'1.5px solid var(--neutral-200)', fontSize:14, fontFamily:'inherit',
    outline:'none', color:'var(--neutral-900)', background:'#fff', boxSizing:'border-box' as const,
  };
  const focusProps = {
    onFocus:(e:any)=>{ e.target.style.borderColor='var(--brand-green-mid)'; },
    onBlur: (e:any)=>{ e.target.style.borderColor='var(--neutral-200)'; },
  };


  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, fontWeight:800, color:'var(--brand-green)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>Admin</div>
        <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'var(--neutral-900)', letterSpacing:'-0.03em' }}>Settings</h1>
        <div style={{ fontSize:13, color:'var(--neutral-500)', marginTop:4 }}>Logged in as <b>{captainName}</b></div>
      </div>

      <Section id="fee" title="💰 Fee & Guarantee" activeId={activeSection} onToggle={id => setActiveSection(activeSection === id ? null : id)}>
        <div style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Base per-hire fee (₹)</label>
          <input type="number" value={settings.perHireFee} onChange={e=>setSettings({...settings,perHireFee:Number(e.target.value)})} style={inputStyle} {...focusProps} />
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Guarantee window (days)</label>
          <input type="number" value={settings.guaranteeDays} onChange={e=>setSettings({...settings,guaranteeDays:Number(e.target.value)})} style={inputStyle} {...focusProps} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>SLA Alert after (days)</label>
          <input type="number" value={settings.slaAlertDays} onChange={e=>setSettings({...settings,slaAlertDays:Number(e.target.value)})} style={inputStyle} {...focusProps} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Ops access code</label>
          <input value={settings.opsCode} onChange={e=>setSettings({...settings,opsCode:e.target.value.toUpperCase()})} style={{ ...inputStyle, fontFamily:'DM Mono, monospace' }} {...focusProps} />
        </div>
        {/* Earning tiers */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Earning Tiers</div>
          {settings.earningTiers.map((tier,i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
              <div style={{ flex:1, fontSize:12, color:'var(--neutral-700)' }}>
                {i===0 ? `1–${tier.upTo}` : i===1 ? `${settings.earningTiers[i-1].upTo+1}–${tier.upTo}` : `${settings.earningTiers[i-1].upTo+1}+`}
              </div>
              <input type="number" value={tier.amount} onChange={e => {
                const updated = [...settings.earningTiers];
                updated[i] = { ...updated[i], amount: Number(e.target.value) };
                setSettings({ ...settings, earningTiers: updated });
              }} style={{ ...inputStyle, width:90 }} {...focusProps} />
              <div style={{ fontSize:12, color:'var(--neutral-500)' }}>₹/hire</div>
            </div>
          ))}
        </div>
        <button onClick={handleSaveSettings} style={{ width:'100%', height:46, borderRadius:12, border:'none', background:'var(--brand-green-mid)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Save Settings</button>
      </Section>

      <Section id="jobtypes" title="🔧 Job Types" activeId={activeSection} onToggle={id => setActiveSection(activeSection === id ? null : id)}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
          {settings.jobTypes.map(jt => (
            <div key={jt} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--brand-green-light)', border:'1px solid rgba(46,168,106,0.2)', borderRadius:99, padding:'5px 10px 5px 12px' }}>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--brand-green)' }}>{jt}</span>
              <button onClick={() => removeJobType(jt)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--brand-green)', fontSize:12, padding:0 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={newJobType} onChange={e=>setNewJobType(e.target.value)} placeholder="Add job type..." style={{ ...inputStyle, flex:1 }} {...focusProps} />
          <button onClick={addJobType} style={{ flexShrink:0, padding:'0 16px', borderRadius:12, border:'none', background:'var(--brand-green-mid)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', height:46 }}>Add</button>
        </div>
      </Section>

      <Section id="locations" title="📍 Locations" activeId={activeSection} onToggle={id => setActiveSection(activeSection === id ? null : id)}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
          {settings.locations.map(loc => (
            <div key={loc} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--accent-gold-light)', border:'1px solid rgba(212,160,23,0.2)', borderRadius:99, padding:'5px 10px 5px 12px' }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#D4A017' }}>{loc}</span>
              <button onClick={() => removeLocation(loc)} style={{ background:'none', border:'none', cursor:'pointer', color:'#D4A017', fontSize:12, padding:0 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={newLocation} onChange={e=>setNewLocation(e.target.value)} placeholder="Add location..." style={{ ...inputStyle, flex:1 }} {...focusProps} />
          <button onClick={addLocation} style={{ flexShrink:0, padding:'0 16px', borderRadius:12, border:'none', background:'#D4A017', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', height:46 }}>Add</button>
        </div>
      </Section>

      <Section id="captains" title="👷 Manage Captains" activeId={activeSection} onToggle={id => setActiveSection(activeSection === id ? null : id)}>
        {captains.map(cap => (
          <div key={cap.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--neutral-200)' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--neutral-900)' }}>{cap.name}</div>
              <div style={{ fontSize:12, color:'var(--neutral-500)', fontFamily:'DM Mono, monospace' }}>{cap.mobile}</div>
            </div>
            <button onClick={() => toggleCaptainActive(cap.id)} style={{ padding:'5px 12px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700, background:cap.active?'var(--success-light)':'var(--danger-light)', color:cap.active?'var(--success)':'var(--danger)' }}>
              {cap.active ? 'Active' : 'Inactive'}
            </button>
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14, marginBottom:8 }}>
          <input value={newCaptainName} onChange={e=>setNewCaptainName(e.target.value)} placeholder="Name" style={inputStyle} {...focusProps} />
          <input value={newCaptainMobile} onChange={e=>setNewCaptainMobile(e.target.value)} placeholder="Mobile" style={{ ...inputStyle, fontFamily:'DM Mono, monospace' }} {...focusProps} />
        </div>
        <button onClick={addCaptain} style={{ width:'100%', height:44, borderRadius:12, border:'1.5px dashed var(--neutral-200)', background:'transparent', color:'var(--neutral-500)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          + Add Captain
        </button>
      </Section>

      <Section id="contacts" title="📞 WhatsApp Contact Numbers" activeId={activeSection} onToggle={id => setActiveSection(activeSection === id ? null : id)}>
        <p style={{ margin:'0 0 12px', fontSize:13, color:'var(--neutral-500)', lineHeight:1.5 }}>
          These numbers appear at the bottom of every joining confirmation message sent to candidates.
        </p>
        {[0, 1].map(i => (
          <div key={i} style={{ marginBottom: 12 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
              Contact Number {i + 1}
            </label>
            <input
              type="tel"
              value={(settings.contactNumbers || ['', ''])[i] || ''}
              onChange={e => {
                const nums = [...(settings.contactNumbers || ['', ''])];
                nums[i] = e.target.value.replace(/\D/g, '').slice(0, 10);
                setSettings({ ...settings, contactNumbers: nums });
              }}
              placeholder={`+91 XXXXX-XXXXX`}
              style={{ ...inputStyle, fontFamily:'DM Mono, monospace' }}
              {...focusProps}
            />
          </div>
        ))}
        <button onClick={handleSaveSettings} style={{ width:'100%', height:46, borderRadius:12, border:'none', background:'var(--brand-green-mid)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Save Numbers</button>
      </Section>

      <Section id="export" title="📊 Data Export" activeId={activeSection} onToggle={id => setActiveSection(activeSection === id ? null : id)}>
        <p style={{ margin:'0 0 12px', fontSize:13, color:'var(--neutral-500)' }}>Download complete pipeline data as CSV for reporting.</p>
        <button id="export-csv-btn" onClick={exportCSV} style={{ width:'100%', height:46, borderRadius:12, border:'1.5px solid var(--neutral-200)', background:'transparent', color:'var(--neutral-700)', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          📥 Export Pipeline as CSV
        </button>
      </Section>

      <button id="ops-logout-btn" onClick={clearRole} style={{ width:'100%', height:48, borderRadius:14, border:'1.5px solid rgba(220,38,38,0.25)', background:'var(--danger-light)', color:'var(--danger)', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
