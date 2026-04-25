import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ChevronDown, StickyNote, Calendar, Briefcase, Clock, User, Navigation } from 'lucide-react';
import {
  addCandidate, getSettings, getJobs, getEarningRateForPlacementNumber,
  getCaptainStats, setLeadExtra,
} from '../../lib/data';
import { useRole } from '../../contexts/RoleContext';
import toast from 'react-hot-toast';

const JOB_ICONS: Record<string, string> = {
  'Security Guard': '🛡️',
  'Housekeeping':   '🧹',
  'Driver':         '🚗',
  'Cook':           '👨‍🍳',
  'Helper':         '🤝',
  'Other':          '💼',
};

const todayStr = () => new Date().toISOString().split('T')[0];
const tomorrowStr = () => {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

function Section({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9 }}>{label}</label>
      {children}
    </div>
  );
}

export default function AddLeadPage() {
  const { captainId, captainName } = useRole();
  const navigate = useNavigate();
  const settings    = getSettings();
  const activeJobs  = getJobs().filter(j => j.active);
  const stats       = getCaptainStats(captainId);

  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [jobType, setJobType]       = useState(settings.jobTypes[0] || 'Security Guard');
  const [location, setLocation]     = useState('');
  const [customArea, setCustomArea] = useState('');
  const [linkedJobId, setLinkedJob]       = useState('');
  const [joiningDate, setJoining]         = useState('');
  const [followUpDate, setFollowUp]       = useState(tomorrowStr());
  const [reportingTime, setReportingTime] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [note, setNote]                   = useState('');
  const [loading, setLoading]             = useState(false);
  const [geo, setGeo]           = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'loading' | 'ok' | 'denied' | null>('loading');

  const expectedEarning = getEarningRateForPlacementNumber((stats?.placements || 0) + 1);
  const phoneDigits     = phone.replace(/\D/g, '');
  const phoneValid      = phoneDigits.length === 10;
  const nameValid       = name.trim().length >= 2;
  const isOther         = location === 'Other';
  const effectiveLocation = isOther ? customArea.trim() : location;
  const canSubmit       = nameValid && phoneValid && !!location && (!isOther || customArea.trim().length >= 2);

  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 10);
    return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
  };

  const handleLinkedJobChange = (jobId: string) => {
    setLinkedJob(jobId);
    if (jobId) {
      const job = activeJobs.find(j => j.id === jobId);
      if (job) {
        const match = settings.jobTypes.find(jt => jt.toLowerCase() === job.role.toLowerCase());
        if (match) setJobType(match);
        const locMatch = settings.locations.find(l => job.location.includes(l));
        if (locMatch) setLocation(locMatch);
      }
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) { setGeoStatus('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGeoStatus('ok');
      },
      () => setGeoStatus('denied'),
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 },
    );
  }, []);

  const handleSubmit = () => {
    if (!nameValid)  { toast.error('Enter at least 2 characters for name'); return; }
    if (!phoneValid) { toast.error('Enter a valid 10-digit number'); return; }
    if (!location)   { toast.error('Select a location'); return; }
    if (isOther && customArea.trim().length < 2) { toast.error('Enter the area name'); return; }
    setLoading(true);

    const newCand = addCandidate({
      name: name.trim(),
      mobile: phoneDigits,
      jobType,
      location: effectiveLocation,
      currentStage: 'Sourced',
      referredBy: captainId,
      submittedAt: new Date().toISOString(),
      placedAt: null,
      guaranteeExpiresAt: null,
      replacementNeeded: false,
      geo: geo || undefined,
      payout: { amount: expectedEarning, status: 'pending', paidAt: null },
      timeline: [{
        stage: 'Sourced',
        movedAt: new Date().toISOString(),
        movedBy: captainName || 'Captain',
        note: note.trim() || 'Lead added by captain',
      }],
      notes: note.trim()
        ? [{ text: note.trim(), addedBy: captainName || 'Captain', addedAt: new Date().toISOString() }]
        : [],
      flagged: false,
      archived: false,
    });

    setLeadExtra(newCand.id, {
      linkedJobId:   linkedJobId || undefined,
      joiningDate:   joiningDate || null,
      followUpDate:  followUpDate || null,
      reportingTime: reportingTime || undefined,
      contactPerson: contactPerson || undefined,
    });

    toast.success(`${name.trim()} added! Follow-up set for ${followUpDate ? new Date(followUpDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'tomorrow'} 🎯`);
    navigate('/captain/leads');
  };

  const inputBase: React.CSSProperties = {
    width: '100%', height: 52, borderRadius: 14,
    border: '1.5px solid var(--neutral-200)',
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
    color: 'var(--neutral-900)', background: '#fff',
    boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--brand-green-mid)';
    e.target.style.boxShadow   = '0 0 0 3px rgba(46,168,106,0.12)';
  };
  const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--neutral-200)';
    e.target.style.boxShadow   = 'none';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px solid var(--neutral-200)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={18} color="var(--neutral-700)" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-green-mid)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>New Lead</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.02em' }}>Add Candidate</h1>
        </div>
        <div style={{ background: 'var(--brand-green-light)', border: '1.5px solid rgba(46,168,106,0.25)', borderRadius: 12, padding: '7px 13px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-green)', fontFamily: 'DM Mono, monospace' }}>₹{expectedEarning}</div>
          <div style={{ fontSize: 9, color: 'var(--brand-green)', fontWeight: 700, textTransform: 'uppercase' }}>on hire</div>
        </div>
      </div>

      {/* ── Linked job (optional) ── */}
      {activeJobs.length > 0 && (
        <Section label="Link to a Job Opening (optional)">
          <div style={{ position: 'relative' }}>
            <Briefcase size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', pointerEvents: 'none', zIndex: 1 }} />
            <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', pointerEvents: 'none' }} />
            <select
              value={linkedJobId}
              onChange={e => handleLinkedJobChange(e.target.value)}
              style={{ ...inputBase, padding: '14px 40px 14px 42px', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' } as React.CSSProperties}
              onFocus={onF} onBlur={onB}
            >
              <option value="">— Not linked to a specific job —</option>
              {activeJobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.role} · {j.location} · {j.salaryRange} [{j.openings - j.filled} open]
                </option>
              ))}
            </select>
          </div>
          {linkedJobId && (() => {
            const job = activeJobs.find(j => j.id === linkedJobId)!;
            return (
              <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 12, background: 'var(--brand-green-light)', border: '1.5px solid rgba(46,168,106,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🎯</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-green-dark)' }}>{job.role} — {job.location}</div>
                  <div style={{ fontSize: 11, color: 'var(--brand-green)', marginTop: 1 }}>{job.salaryRange} · {job.openings - job.filled} open slots</div>
                </div>
              </div>
            );
          })()}
        </Section>
      )}

      {/* ── Name ── */}
      <Section label={<>Full Name *</>}>
        <div style={{ position: 'relative' }}>
          <input
            type="text" value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Candidate's full name"
            style={{ ...inputBase, padding: '14px 44px 14px 16px' }}
            onFocus={onF} onBlur={onB}
            onKeyDown={e => e.key === 'Enter' && (document.getElementById('lead-phone') as HTMLInputElement)?.focus()}
          />
          {name.length > 0 && (
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: nameValid ? 'var(--brand-green)' : 'var(--neutral-400)' }}>
              {nameValid ? '✓' : '…'}
            </span>
          )}
        </div>
      </Section>

      {/* ── Phone ── */}
      <Section label="Phone Number *">
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: 'var(--neutral-500)', fontFamily: 'DM Mono, monospace', pointerEvents: 'none' }}>+91</div>
          <input
            id="lead-phone" type="tel"
            value={formatPhone(phone)}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="98765-43210"
            style={{ ...inputBase, padding: '14px 44px 14px 52px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}
            onFocus={onF} onBlur={onB}
          />
          {phoneValid && (
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', background: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>✓</div>
          )}
          {phone.length > 0 && !phoneValid && (
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--warning)', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>{phoneDigits.length}/10</span>
          )}
        </div>
      </Section>

      {/* ── Job Type chips ── */}
      <Section label="Job Type *">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {settings.jobTypes.map(jt => {
            const active = jobType === jt;
            return (
              <button key={jt} onClick={() => setJobType(jt)} style={{
                padding: '10px 6px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                border: `1.5px solid ${active ? 'var(--brand-green-mid)' : 'var(--neutral-200)'}`,
                background: active ? 'var(--brand-green-light)' : '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 22 }}>{JOB_ICONS[jt] || '💼'}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--brand-green)' : 'var(--neutral-600)', textAlign: 'center', lineHeight: 1.3 }}>{jt}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Location ── */}
      <Section label="Location *">
        <div style={{ position: 'relative' }}>
          <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', pointerEvents: 'none', zIndex: 1 }} />
          <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', pointerEvents: 'none' }} />
          <select
            value={location} onChange={e => { setLocation(e.target.value); setCustomArea(''); }}
            style={{ ...inputBase, padding: '14px 40px 14px 42px', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', color: location ? 'var(--neutral-900)' : 'var(--neutral-400)' } as React.CSSProperties}
            onFocus={onF} onBlur={onB}
          >
            <option value="" disabled>Select area / locality</option>
            {settings.locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        {isOther && (
          <div style={{ marginTop: 10 }}>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: customArea.trim().length >= 2 ? 'var(--brand-green)' : 'var(--warning)', pointerEvents: 'none' }} />
              <input
                autoFocus
                type="text"
                value={customArea}
                onChange={e => setCustomArea(e.target.value)}
                placeholder="Type the exact area / locality *"
                style={{ ...inputBase, padding: '14px 14px 14px 42px', borderColor: customArea.trim().length >= 2 ? 'var(--brand-green-mid)' : 'var(--warning)' }}
                onFocus={onF} onBlur={onB}
              />
            </div>
            <div style={{ fontSize: 11, color: customArea.trim().length >= 2 ? 'var(--brand-green)' : 'var(--warning)', fontWeight: 600, marginTop: 5, paddingLeft: 2 }}>
              {customArea.trim().length >= 2 ? '✓ Area set' : '⚠️ Required — enter the exact area name'}
            </div>
          </div>
        )}
      </Section>

      {/* ── Dates row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>
            <Calendar size={11} /> Follow-up *
          </label>
          <input
            type="date" value={followUpDate}
            min={todayStr()}
            onChange={e => setFollowUp(e.target.value)}
            style={{ ...inputBase, padding: '14px 12px', fontSize: 14, cursor: 'pointer' }}
            onFocus={onF} onBlur={onB}
          />
          <div style={{ fontSize: 10, color: 'var(--brand-green)', fontWeight: 600, marginTop: 5, paddingLeft: 2 }}>
            📞 Daily reminder will be set
          </div>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>
            <Calendar size={11} /> Joining Date
          </label>
          <input
            type="date" value={joiningDate}
            min={todayStr()}
            onChange={e => setJoining(e.target.value)}
            style={{ ...inputBase, padding: '14px 12px', fontSize: 14, color: joiningDate ? 'var(--neutral-900)' : 'var(--neutral-400)', cursor: 'pointer' }}
            onFocus={onF} onBlur={onB}
          />
          <div style={{ fontSize: 10, color: 'var(--neutral-400)', fontWeight: 600, marginTop: 5, paddingLeft: 2 }}>
            Optional — expected start date
          </div>
        </div>
      </div>

      {/* ── Reporting time + Contact person row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>
            <Clock size={11} /> Reporting Time
          </label>
          <div style={{ position: 'relative' }}>
            <Clock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', pointerEvents: 'none' }} />
            <input
              type="time" value={reportingTime}
              onChange={e => setReportingTime(e.target.value)}
              style={{ ...inputBase, padding: '14px 12px 14px 36px', fontSize: 14, cursor: 'pointer', color: reportingTime ? 'var(--neutral-900)' : 'var(--neutral-400)' }}
              onFocus={onF} onBlur={onB}
            />
          </div>
          <div style={{ fontSize: 10, color: 'var(--neutral-400)', fontWeight: 600, marginTop: 5, paddingLeft: 2 }}>Optional joining time</div>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>
            <User size={11} /> Contact Person
          </label>
          <div style={{ position: 'relative' }}>
            <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', pointerEvents: 'none' }} />
            <input
              type="text" value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
              placeholder="Manager name"
              style={{ ...inputBase, padding: '14px 12px 14px 36px', fontSize: 14 }}
              onFocus={onF} onBlur={onB}
            />
          </div>
          <div style={{ fontSize: 10, color: 'var(--neutral-400)', fontWeight: 600, marginTop: 5, paddingLeft: 2 }}>Who to report to</div>
        </div>
      </div>

      {/* ── Geotag (auto) ── */}
      <div style={{ marginBottom: 20 }}>
        {geoStatus === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'var(--neutral-100)', border: '1px solid var(--neutral-200)' }}>
            <Navigation size={14} color="var(--neutral-400)" />
            <span style={{ fontSize: 12, color: 'var(--neutral-400)', fontWeight: 600 }}>Getting GPS location…</span>
          </div>
        )}
        {geoStatus === 'ok' && geo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--brand-green-light)', border: '1.5px solid rgba(46,168,106,0.2)' }}>
            <Navigation size={14} color="var(--brand-green)" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-green)' }}>📍 Location tagged · </span>
              <span style={{ fontSize: 11, color: 'var(--brand-green)', fontFamily: 'DM Mono, monospace' }}>{geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}</span>
            </div>
          </div>
        )}
        {geoStatus === 'denied' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)' }}>
            <Navigation size={14} color="#D97706" />
            <span style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>Location access denied — allow it in browser settings</span>
          </div>
        )}
      </div>

      {/* ── Note ── */}
      <Section label={<>Note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--neutral-400)', fontSize: 10 }}>(optional)</span></>}>
        <div style={{ position: 'relative' }}>
          <StickyNote size={14} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--neutral-400)', pointerEvents: 'none' }} />
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Skills, referral source, availability…"
            rows={3}
            style={{ ...inputBase, height: 'auto', padding: '14px 14px 14px 40px', resize: 'none', lineHeight: 1.6 } as React.CSSProperties}
            onFocus={onF} onBlur={onB}
          />
        </div>
      </Section>

      {/* Submit */}
      <button
        onClick={handleSubmit} disabled={loading}
        style={{
          width: '100%', height: 56, borderRadius: 16, border: 'none',
          background: canSubmit ? 'linear-gradient(135deg, #2EA86A, #1A7A4A)' : 'var(--neutral-200)',
          color: canSubmit ? '#fff' : 'var(--neutral-500)',
          fontSize: 16, fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          boxShadow: canSubmit ? '0 6px 28px rgba(46,168,106,0.4)' : 'none',
          opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'all 0.25s',
          marginBottom: 8,
        }}
        onPointerDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
        onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {loading ? 'Saving…' : '🎯  Add Lead'}
      </button>

      {!canSubmit && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--neutral-400)' }}>
          Fill name, phone, and location to continue
        </div>
      )}
    </div>
  );
}
