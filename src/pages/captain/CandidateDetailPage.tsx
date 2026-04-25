import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Edit2, Check, X } from 'lucide-react';
import {
  getCandidates, getCaptains, addNoteToCandidate, updateCandidate, getSettings,
  getJobs, getLeadExtra, setLeadExtra, buildConfirmationMessage,
  type Candidate, type Captain,
} from '../../lib/data';
import { useRole } from '../../contexts/RoleContext';
import toast from 'react-hot-toast';

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Sourced:     { bg: 'rgba(107,114,128,0.12)', text: '#6B7280' },
  Screening:   { bg: 'rgba(37,99,235,0.12)',   text: '#2563EB' },
  Interviewed: { bg: 'rgba(217,119,6,0.12)',   text: '#D97706' },
  Offered:     { bg: 'rgba(124,58,237,0.12)',  text: '#7C3AED' },
  Placed:      { bg: 'rgba(5,150,105,0.12)',   text: '#059669' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', height: 46, padding: '11px 14px', borderRadius: 12,
  border: '1.5px solid var(--neutral-200)', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', color: 'var(--neutral-900)', background: '#fff', boxSizing: 'border-box',
};
const fh = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--brand-green-mid)'; },
  onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--neutral-200)'; },
};
const Lbl = ({ text }: { text: string }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{text}</label>
);

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { captainName } = useRole();
  const settings = getSettings();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [captainMap, setCaptainMap] = useState<Record<string, string>>({});
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName]             = useState('');
  const [editPhone, setEditPhone]           = useState('');
  const [editJobType, setEditJobType]       = useState('');
  const [editLocation, setEditLocation]     = useState('');
  const [editCustomLoc, setEditCustomLoc]   = useState('');
  const [editLinkedJob, setEditLinkedJob]   = useState('');

  const load = useCallback(() => {
    const found = getCandidates().find((c) => c.id === id);
    setCandidate(found || null);
    const cm: Record<string, string> = {};
    getCaptains().forEach((cap: Captain) => { cm[cap.id] = cap.name; });
    setCaptainMap(cm);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openEdit = () => {
    if (!candidate) return;
    setEditName(candidate.name);
    setEditPhone(candidate.mobile);
    const knownLoc = settings.locations.includes(candidate.location);
    setEditLocation(knownLoc ? candidate.location : 'Other');
    setEditCustomLoc(knownLoc ? '' : candidate.location);
    setEditJobType(candidate.jobType);
    setEditLinkedJob(getLeadExtra(candidate.id).linkedJobId || '');
    setEditing(true);
  };

  const handleSave = () => {
    if (!candidate) return;
    if (editName.trim().length < 2) { toast.error('Name must be at least 2 characters'); return; }
    const phoneDigits = editPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) { toast.error('Enter a valid 10-digit number'); return; }
    const isOther = editLocation === 'Other';
    if (isOther && editCustomLoc.trim().length < 2) { toast.error('Enter the area name'); return; }
    updateCandidate(candidate.id, {
      name:     editName.trim(),
      mobile:   phoneDigits,
      jobType:  editJobType,
      location: isOther ? editCustomLoc.trim() : editLocation,
    });
    setLeadExtra(candidate.id, { linkedJobId: editLinkedJob || undefined });
    toast.success('Details updated!');
    setEditing(false);
    load();
  };

  const handleAddNote = () => {
    if (!candidate || !noteText.trim()) return;
    addNoteToCandidate(candidate.id, noteText.trim(), captainName || 'Captain');
    setNoteText('');
    setShowNoteInput(false);
    load();
  };

  if (!candidate) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ fontSize: 16, color: 'var(--neutral-500)', marginTop: 12 }}>Candidate not found</div>
      </div>
    );
  }

  const sc = STAGE_COLORS[candidate.currentStage] || { bg: '#f3f4f6', text: '#6B7280' };
  const guaranteeDaysLeft = candidate.guaranteeExpiresAt
    ? Math.ceil((new Date(candidate.guaranteeExpiresAt).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px solid var(--neutral-200)', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={18} color="var(--neutral-700)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.02em' }}>
            {candidate.name}
          </h1>
          <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text, marginTop: 4 }}>
            {candidate.currentStage}
          </span>
        </div>
        {!editing && (
          <button
            onClick={openEdit}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid var(--brand-green-mid)', background: 'rgba(46,168,106,0.08)', color: 'var(--brand-green)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          >
            <Edit2 size={13} /> Edit
          </button>
        )}
      </div>

      {/* ── EDIT FORM ── */}
      {editing && (
        <div style={{ background: '#fff', border: '1.5px solid var(--brand-green-mid)', borderRadius: 18, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--neutral-900)' }}>Edit Candidate Details</div>
            <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={16} color="var(--neutral-500)" />
            </button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Lbl text="Full Name *" />
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name" style={inputStyle} {...fh} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <Lbl text="Phone Number *" />
            <input
              type="tel"
              value={editPhone.replace(/\D/g, '').replace(/(\d{5})(\d{0,5})/, '$1-$2')}
              onChange={e => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="98765-43210"
              style={{ ...inputStyle, fontFamily: 'DM Mono, monospace' }}
              {...fh}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <Lbl text="Job Type *" />
            <select value={editJobType} onChange={e => setEditJobType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} {...fh}>
              {settings.jobTypes.map(jt => <option key={jt} value={jt}>{jt}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: editLocation === 'Other' ? 10 : 16 }}>
            <Lbl text="Location *" />
            <select value={editLocation} onChange={e => { setEditLocation(e.target.value); setEditCustomLoc(''); }} style={{ ...inputStyle, cursor: 'pointer' }} {...fh}>
              <option value="" disabled>Select location</option>
              {settings.locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {editLocation === 'Other' && (
            <div style={{ marginBottom: 16 }}>
              <Lbl text="Area Name *" />
              <input
                autoFocus
                value={editCustomLoc}
                onChange={e => setEditCustomLoc(e.target.value)}
                placeholder="Type the exact area / locality"
                style={{ ...inputStyle, borderColor: editCustomLoc.trim().length >= 2 ? 'var(--brand-green-mid)' : 'var(--warning)' }}
                {...fh}
              />
            </div>
          )}

          {(() => {
            const activeJobs = getJobs().filter(j => j.active);
            if (activeJobs.length === 0) return null;
            return (
              <div style={{ marginBottom: 16 }}>
                <Lbl text="Link to Job Opening" />
                <select value={editLinkedJob} onChange={e => {
                  const jobId = e.target.value;
                  setEditLinkedJob(jobId);
                  if (jobId) {
                    const job = activeJobs.find(j => j.id === jobId);
                    if (job) {
                      const matchType = settings.jobTypes.find(jt => jt.toLowerCase() === job.role.toLowerCase());
                      if (matchType) setEditJobType(matchType);
                      const matchLoc = settings.locations.find(l => job.location.includes(l));
                      if (matchLoc) { setEditLocation(matchLoc); setEditCustomLoc(''); }
                    }
                  }
                }} style={{ ...inputStyle, cursor: 'pointer' }} {...fh}>
                  <option value="">— Not linked —</option>
                  {activeJobs.map(j => (
                    <option key={j.id} value={j.id}>{j.role} · {j.location} · {j.salaryRange} [{j.openings - j.filled} open]</option>
                  ))}
                </select>
                {editLinkedJob && (() => {
                  const job = activeJobs.find(j => j.id === editLinkedJob);
                  if (!job) return null;
                  return (
                    <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--brand-green-light)', border: '1px solid rgba(46,168,106,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🎯</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-green-dark)' }}>{job.role} — {job.location}</div>
                        <div style={{ fontSize: 11, color: 'var(--brand-green)', marginTop: 1 }}>{job.salaryRange} · {job.openings - job.filled} slots open</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setEditing(false)} style={{ flex: 1, height: 46, borderRadius: 12, border: '1.5px solid var(--neutral-200)', background: 'transparent', fontSize: 14, fontWeight: 700, color: 'var(--neutral-500)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleSave} style={{ flex: 2, height: 46, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,var(--brand-green-mid),var(--brand-green))', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check size={15} /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Contact card */}
      <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Contact</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontFamily: 'DM Mono, monospace', color: 'var(--neutral-900)', fontWeight: 600 }}>
            📞 {candidate.mobile.slice(0, 5)}-{candidate.mobile.slice(5)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <a href={`tel:${candidate.mobile}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(46,168,106,0.1)', border: '1px solid rgba(46,168,106,0.2)', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, color: 'var(--brand-green)', textDecoration: 'none' }}>
            <Phone size={15} /> Call
          </a>
          <a href={`https://wa.me/91${candidate.mobile}?text=${encodeURIComponent(`Hi ${candidate.name}! Switch टीम से हूँ। आपकी job के बारे में update देना था. 😊`)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #25D366, #128C7E)', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
            <MessageCircle size={15} /> WhatsApp
          </a>
        </div>

        {candidate.currentStage === 'Interviewed' && (
          <a href={`https://wa.me/91${candidate.mobile}?text=${encodeURIComponent(`🎉 Badhai ho, ${candidate.name} ji!\n\nAapka interview successfully complete ho gaya hai! 👏\n\n💼 Role: ${candidate.jobType}\n📍 Location: ${candidate.location}\n\nJaldi hi aapko joining ke baare mein call aayega. Ready rehna!\n\n— Switch Captain ⚡`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 700, color: '#D97706', textDecoration: 'none', width: '100%' }}>
            <MessageCircle size={14} /> Send Interview Confirmation
          </a>
        )}
        {candidate.currentStage === 'Offered' && (
          <a href={`https://wa.me/91${candidate.mobile}?text=${encodeURIComponent(`🎊 Badhai ho, ${candidate.name} ji!\n\nAapko job offer mil gayi hai! 🥳\n\n💼 Role: ${candidate.jobType}\n📍 Location: ${candidate.location}\n\nOffer confirm karne ke liye reply karein.\n\n— Switch Captain ⚡`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 700, color: '#7C3AED', textDecoration: 'none', width: '100%' }}>
            <MessageCircle size={14} /> Send Offer Confirmation
          </a>
        )}
        {candidate.currentStage === 'Placed' && (
          <a
            href={`https://wa.me/91${candidate.mobile}?text=${encodeURIComponent(buildConfirmationMessage(candidate, getLeadExtra(candidate.id)))}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#25D366,#128C7E)', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', width: '100%' }}
          >
            <MessageCircle size={14} /> Send Joining Confirmation 🎉
          </a>
        )}
      </div>

      {/* Details */}
      <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Details</div>
        {(() => {
          const extra = getLeadExtra(candidate.id);
          const rows: { label: string; value: React.ReactNode }[] = [
            { label: 'Job Type',    value: '🔧 ' + candidate.jobType },
            { label: 'Location',   value: '📍 ' + candidate.location },
            { label: 'Referred by',value: '👤 ' + (captainMap[candidate.referredBy] || 'You') },
            { label: 'Submitted',  value: new Date(candidate.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
            ...(candidate.currentJob ? [{ label: 'Current Job', value: candidate.currentJob }] : []),
            ...(extra.joiningDate ? [{ label: 'Joining Date', value: '📅 ' + new Date(extra.joiningDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }] : []),
            ...(extra.reportingTime ? [{ label: 'Reporting Time', value: '⏰ ' + extra.reportingTime }] : []),
            ...(extra.contactPerson ? [{ label: 'Contact Person', value: '👤 ' + extra.contactPerson }] : []),
          ];
          return (
            <>
              {rows.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--neutral-200)' }}>
                  <span style={{ fontSize: 13, color: 'var(--neutral-500)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-900)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                </div>
              ))}
              {candidate.geo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--neutral-200)' }}>
                  <span style={{ fontSize: 13, color: 'var(--neutral-500)' }}>Geotag</span>
                  <a
                    href={`https://maps.google.com/maps?q=${candidate.geo.lat},${candidate.geo.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    📍 View on Map
                  </a>
                </div>
              )}
              {candidate.currentStage === 'Placed' && guaranteeDaysLeft !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 13, color: 'var(--neutral-500)' }}>Guarantee</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: guaranteeDaysLeft < 7 ? 'var(--danger)' : guaranteeDaysLeft < 0 ? 'var(--neutral-500)' : 'var(--success)' }}>
                    {guaranteeDaysLeft < 0 ? '✓ Expired' : guaranteeDaysLeft === 0 ? '⚠️ Expires today!' : `${guaranteeDaysLeft}d left`}
                  </span>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Timeline */}
      <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Stage History</div>
        <div style={{ position: 'relative' }}>
          {candidate.timeline.map((entry, i) => {
            const isLast = i === candidate.timeline.length - 1;
            const sc2 = STAGE_COLORS[entry.stage] || { bg: '#f3f4f6', text: '#6B7280' };
            return (
              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 18, position: 'relative' }}>
                {!isLast && <div style={{ position: 'absolute', left: 9, top: 20, bottom: 0, width: 2, background: 'var(--neutral-200)' }} />}
                <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: sc2.text, border: '3px solid var(--neutral-50)', boxShadow: '0 0 0 2px var(--neutral-200)' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--neutral-900)' }}>{entry.stage}</span>
                    {isLast && <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 800, background: sc2.bg, color: sc2.text }}>CURRENT</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>
                    {new Date(entry.movedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                    at {new Date(entry.movedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {' · by '}{captainMap[entry.movedBy] || (entry.movedBy.startsWith('ops') ? 'Ops' : entry.movedBy)}
                  </div>
                  {entry.note && <div style={{ fontSize: 12, color: 'var(--neutral-700)', marginTop: 4, fontStyle: 'italic' }}>"{entry.note}"</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {candidate.notes.length > 0 && (
        <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Notes</div>
          {candidate.notes.map((note, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < candidate.notes.length - 1 ? '1px solid var(--neutral-200)' : 'none' }}>
              <div style={{ fontSize: 13, color: 'var(--neutral-900)', lineHeight: 1.5 }}>{note.text}</div>
              <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 4 }}>
                {note.addedBy} · {new Date(note.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add note */}
      {showNoteInput ? (
        <div style={{ background: 'var(--neutral-50)', border: '1.5px solid var(--brand-green-mid)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note about this candidate..."
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--neutral-900)', lineHeight: 1.5, resize: 'none', fontFamily: 'inherit', minHeight: 80, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => setShowNoteInput(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: 'transparent', fontSize: 13, fontWeight: 700, color: 'var(--neutral-500)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleAddNote} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--brand-green-mid)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Save Note</button>
          </div>
        </div>
      ) : (
        <button id="add-note-btn" onClick={() => setShowNoteInput(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1.5px dashed var(--neutral-200)', background: 'transparent', fontSize: 14, fontWeight: 600, color: 'var(--neutral-500)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          + Add Note
        </button>
      )}
    </div>
  );
}
