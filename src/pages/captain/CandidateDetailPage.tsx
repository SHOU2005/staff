import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle } from 'lucide-react';
import {
  getCandidates, getCaptains, addNoteToCandidate,
  type Candidate, type Captain,
} from '../../lib/data';
import { useRole } from '../../contexts/RoleContext';

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Sourced:     { bg: 'rgba(107,114,128,0.12)', text: '#6B7280' },
  Screening:   { bg: 'rgba(37,99,235,0.12)',   text: '#2563EB' },
  Interviewed: { bg: 'rgba(217,119,6,0.12)',   text: '#D97706' },
  Offered:     { bg: 'rgba(124,58,237,0.12)',  text: '#7C3AED' },
  Placed:      { bg: 'rgba(5,150,105,0.12)',   text: '#059669' },
};

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { captainName } = useRole();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [captainMap, setCaptainMap] = useState<Record<string, string>>({});
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const load = useCallback(() => {
    const found = getCandidates().find((c) => c.id === id);
    setCandidate(found || null);
    const cm: Record<string, string> = {};
    getCaptains().forEach((cap: Captain) => { cm[cap.id] = cap.name; });
    setCaptainMap(cm);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!candidate) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ fontSize: 16, color: 'var(--neutral-500)', marginTop: 12 }}>Candidate not found</div>
      </div>
    );
  }

  const sc = STAGE_COLORS[candidate.currentStage] || { bg: '#f3f4f6', text: '#6B7280' };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteToCandidate(candidate.id, noteText.trim(), captainName || 'Captain');
    setNoteText('');
    setShowNoteInput(false);
    load();
  };

  const guaranteeDaysLeft = candidate.guaranteeExpiresAt
    ? Math.ceil((new Date(candidate.guaranteeExpiresAt).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: 12, border: '1.5px solid var(--neutral-200)',
            background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} color="var(--neutral-700)" />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.02em' }}>
            {candidate.name}
          </h1>
          <span style={{
            display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: sc.bg, color: sc.text, marginTop: 4,
          }}>
            {candidate.currentStage}
          </span>
        </div>
      </div>

      {/* Contact card */}
      <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Contact
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontFamily: 'DM Mono, monospace', color: 'var(--neutral-900)', fontWeight: 600 }}>
            📞 {candidate.mobile.slice(0, 5)}-{candidate.mobile.slice(5)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`tel:${candidate.mobile}`} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(46,168,106,0.1)', border: '1px solid rgba(46,168,106,0.2)',
            borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700,
            color: 'var(--brand-green)', textDecoration: 'none',
          }}>
            <Phone size={15} /> Call
          </a>
          <a
            href={`https://wa.me/91${candidate.mobile}?text=${encodeURIComponent(`Hi ${candidate.name}! Switch टीम से हूँ। आपकी job के बारे में update देना था. 😊`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700,
              color: '#fff', textDecoration: 'none',
            }}
          >
            <MessageCircle size={15} /> WhatsApp
          </a>
        </div>
      </div>

      {/* Details */}
      <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Details
        </div>
        {[
          { label: 'Job Type', value: '🔧 ' + candidate.jobType },
          { label: 'Location', value: '📍 ' + candidate.location },
          { label: 'Referred by', value: '👤 ' + (captainMap[candidate.referredBy] || 'You') },
          { label: 'Submitted', value: new Date(candidate.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
          ...(candidate.currentJob ? [{ label: 'Current Job', value: candidate.currentJob }] : []),
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--neutral-200)' }}>
            <span style={{ fontSize: 13, color: 'var(--neutral-500)' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-900)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
          </div>
        ))}
        {candidate.currentStage === 'Placed' && guaranteeDaysLeft !== null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 13, color: 'var(--neutral-500)' }}>Guarantee</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: guaranteeDaysLeft < 7 ? 'var(--danger)' : guaranteeDaysLeft < 0 ? 'var(--neutral-500)' : 'var(--success)' }}>
              {guaranteeDaysLeft < 0 ? '✓ Expired' : guaranteeDaysLeft === 0 ? '⚠️ Expires today!' : `${guaranteeDaysLeft}d left`}
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Stage History
        </div>
        <div style={{ position: 'relative' }}>
          {candidate.timeline.map((entry, i) => {
            const isLast = i === candidate.timeline.length - 1;
            const sc2 = STAGE_COLORS[entry.stage] || { bg: '#f3f4f6', text: '#6B7280' };
            return (
              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 18, position: 'relative' }}>
                {!isLast && (
                  <div style={{
                    position: 'absolute', left: 9, top: 20, bottom: 0, width: 2,
                    background: 'var(--neutral-200)',
                  }} />
                )}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: sc2.text, border: '3px solid var(--neutral-50)',
                  boxShadow: '0 0 0 2px var(--neutral-200)',
                }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--neutral-900)' }}>{entry.stage}</span>
                    {isLast && (
                      <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 800, background: sc2.bg, color: sc2.text }}>CURRENT</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>
                    {new Date(entry.movedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                    at {new Date(entry.movedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {' · by '}{captainMap[entry.movedBy] || (entry.movedBy.startsWith('ops') ? 'Ops' : entry.movedBy)}
                  </div>
                  {entry.note && (
                    <div style={{ fontSize: 12, color: 'var(--neutral-700)', marginTop: 4, fontStyle: 'italic' }}>
                      "{entry.note}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {candidate.notes.length > 0 && (
        <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Notes
          </div>
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
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--neutral-900)', lineHeight: 1.5, resize: 'none',
              fontFamily: 'inherit', minHeight: 80, boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => setShowNoteInput(false)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: 'transparent', fontSize: 13, fontWeight: 700, color: 'var(--neutral-500)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--brand-green-mid)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Save Note
            </button>
          </div>
        </div>
      ) : (
        <button
          id="add-note-btn"
          onClick={() => setShowNoteInput(true)}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            border: '1.5px dashed var(--neutral-200)', background: 'transparent',
            fontSize: 14, fontWeight: 600, color: 'var(--neutral-500)',
            cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          + Add Note
        </button>
      )}
    </div>
  );
}
