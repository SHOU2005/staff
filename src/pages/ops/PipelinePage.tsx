import { useEffect, useState, useCallback } from 'react';

import { Phone, MessageCircle, ChevronRight, ArrowRight } from 'lucide-react';
import {
  getCandidates, getCaptains, moveCandidateStage, addNoteToCandidate,
  STAGE_ORDER, getNextStage, type Candidate, type Captain,
  getInitials, timeAgo,
} from '../../lib/data';

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Sourced:     { bg: '#F9FAFB',                    text: '#6B7280', border: '#E5E7EB' },
  Screening:   { bg: 'rgba(37,99,235,0.06)',        text: '#2563EB', border: 'rgba(37,99,235,0.2)' },
  Interviewed: { bg: 'rgba(217,119,6,0.06)',        text: '#D97706', border: 'rgba(217,119,6,0.2)' },
  Offered:     { bg: 'rgba(124,58,237,0.06)',       text: '#7C3AED', border: 'rgba(124,58,237,0.2)' },
  Placed:      { bg: 'rgba(5,150,105,0.06)',        text: '#059669', border: 'rgba(5,150,105,0.2)' },
};

export default function PipelinePage() {

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [captainMap, setCaptainMap] = useState<Record<string, string>>({});
  const [view, setView] = useState<'list' | 'kanban'>(() => (localStorage.getItem('ops_pipeline_view') as 'list' | 'kanban') || 'list');
  const [filterStage, setFilterStage] = useState<string>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveNote, setMoveNote] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const load = useCallback(() => {
    const all = getCandidates();
    all.sort((a, b) => {
      const lastA = a.timeline[a.timeline.length - 1]?.movedAt || a.submittedAt;
      const lastB = b.timeline[b.timeline.length - 1]?.movedAt || b.submittedAt;
      return new Date(lastA).getTime() - new Date(lastB).getTime();
    });
    setCandidates(all);
    const cm: Record<string, string> = {};
    getCaptains().forEach((c: Captain) => { cm[c.id] = c.name; });
    setCaptainMap(cm);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleView = (v: 'list' | 'kanban') => {
    setView(v);
    localStorage.setItem('ops_pipeline_view', v);
  };

  const selected = candidates.find((c) => c.id === selectedId);
  const nextStage = selected ? getNextStage(selected.currentStage) : null;

  const handleMove = () => {
    if (!selected || !nextStage) return;
    moveCandidateStage(selected.id, nextStage, 'ops_001', moveNote);
    setShowMoveModal(false);
    setMoveNote('');
    setSelectedId(null);
    load();
  };

  const handleAddNote = () => {
    if (!selected || !noteInput.trim()) return;
    addNoteToCandidate(selected.id, noteInput.trim(), 'Ops');
    setNoteInput('');
    load();
    setSelectedId(candidates.find((c) => c.id === selected.id)?.id || null);
  };

  const filtered = filterStage === 'All'
    ? candidates
    : candidates.filter((c) => c.currentStage === filterStage);

  const getDaysInStage = (c: Candidate) => {
    const last = c.timeline[c.timeline.length - 1];
    return last ? Math.floor((Date.now() - new Date(last.movedAt).getTime()) / 86400000) : 0;
  };

  const CandidateCard = ({ c, compact = false }: { c: Candidate; compact?: boolean }) => {
    const sc = STAGE_COLORS[c.currentStage] || STAGE_COLORS.Sourced;
    const days = getDaysInStage(c);
    return (
      <div
        id={`pipeline-card-${c.id}`}
        onClick={() => setSelectedId(c.id)}
        style={{
          background: 'var(--neutral-50)', border: `1.5px solid ${sc.border}`,
          borderRadius: compact ? 12 : 16, padding: compact ? '10px 12px' : '14px 16px',
          cursor: 'pointer', transition: 'transform 0.15s', marginBottom: compact ? 8 : 10,
        }}
        onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: compact ? 36 : 42, height: compact ? 36 : 42, borderRadius: 10,
            background: `${sc.text}18`, color: sc.text, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: compact ? 12 : 13, fontWeight: 800,
          }}>
            {getInitials(c.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: 'var(--neutral-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.name}
            </div>
            {!compact && (
              <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 2 }}>
                {c.jobType} · {c.location}
              </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--neutral-500)', marginTop: 2 }}>
              By {captainMap[c.referredBy] || '—'} · {days}d
            </div>
          </div>
          <ChevronRight size={14} color="var(--neutral-500)" />
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            Ops Pipeline
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>
            Candidates ({candidates.length})
          </h1>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--neutral-200)', borderRadius: 10, padding: 3 }}>
          {(['list', 'kanban'] as const).map((v) => (
            <button
              key={v}
              id={`view-${v}-btn`}
              onClick={() => toggleView(v)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                background: view === v ? '#fff' : 'transparent',
                color: view === v ? 'var(--neutral-900)' : 'var(--neutral-500)',
                transition: 'all 0.2s',
                boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {v === 'list' ? '☰ List' : '⠿ Kanban'}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, marginBottom: 16, scrollbarWidth: 'none' }}>
        {(['All', ...STAGE_ORDER] as string[]).map((s) => {
          const count = s === 'All' ? candidates.length : candidates.filter((c) => c.currentStage === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterStage(s)}
              style={{
                padding: '7px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit',
                border: '1.5px solid',
                borderColor: filterStage === s ? 'var(--brand-green-mid)' : 'var(--neutral-200)',
                background: filterStage === s ? 'var(--brand-green-light)' : 'transparent',
                color: filterStage === s ? 'var(--brand-green)' : 'var(--neutral-500)',
                transition: 'all 0.2s',
              }}
            >
              {s} <span style={{ opacity: 0.7 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* List view */}
      {view === 'list' && (
        <div>
          {filtered.map((c) => <CandidateCard key={c.id} c={c} />)}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--neutral-500)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div>No candidates in this stage</div>
            </div>
          )}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
          {STAGE_ORDER.map((stage) => {
            const stageCandidates = candidates.filter((c) => c.currentStage === stage);
            const sc = STAGE_COLORS[stage];
            return (
              <div key={stage} style={{ minWidth: 240, maxWidth: 240, flexShrink: 0 }}>
                <div style={{
                  padding: '10px 12px', borderRadius: '12px 12px 0 0',
                  background: sc.bg, border: `1.5px solid ${sc.border}`,
                  borderBottom: 'none', marginBottom: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: sc.text }}>{stage}</span>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', background: `${sc.text}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: sc.text,
                  }}>
                    {stageCandidates.length}
                  </span>
                </div>
                <div style={{
                  padding: '10px 8px', background: `${sc.bg}80`,
                  border: `1.5px solid ${sc.border}`, borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  minHeight: 120,
                }}>
                  {stageCandidates.map((c) => <CandidateCard key={c.id} c={c} compact />)}
                  {stageCandidates.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--neutral-500)', fontSize: 12 }}>
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate detail slide-up */}
      {selected && (
        <>
          <div
            onClick={() => setSelectedId(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
              backdropFilter: 'blur(4px)',
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
            background: '#fff', borderRadius: '24px 24px 0 0',
            padding: '20px 20px 40px',
            maxHeight: '85dvh', overflowY: 'auto',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--neutral-200)', margin: '0 auto 20px' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)' }}>
                  {selected.name}
                </h2>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: STAGE_COLORS[selected.currentStage]?.bg,
                  color: STAGE_COLORS[selected.currentStage]?.text,
                  border: `1px solid ${STAGE_COLORS[selected.currentStage]?.border}`,
                }}>
                  {selected.currentStage}
                </span>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                style={{ background: 'var(--neutral-100)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {/* Contact */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }} onClick={(e) => e.stopPropagation()}>
              <a href={`tel:${selected.mobile}`} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(46,168,106,0.1)', border: '1px solid rgba(46,168,106,0.2)',
                borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 700,
                color: 'var(--brand-green)', textDecoration: 'none',
              }}>
                <Phone size={14} /> {selected.mobile}
              </a>
              <a
                href={`https://wa.me/91${selected.mobile}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  borderRadius: 12, color: '#fff', textDecoration: 'none',
                }}
              >
                <MessageCircle size={16} />
              </a>
            </div>

            {/* Info rows */}
            <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
              {[
                { label: 'Referred by', value: captainMap[selected.referredBy] || selected.referredBy },
                { label: 'Job Type', value: selected.jobType },
                { label: 'Location', value: selected.location },
                { label: 'Submitted', value: timeAgo(selected.submittedAt) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--neutral-200)' }}>
                  <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-900)' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Timeline</div>
              {selected.timeline.map((entry, i) => {
                const isLast = i === selected.timeline.length - 1;
                const sc2 = STAGE_COLORS[entry.stage] || STAGE_COLORS.Sourced;
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: isLast ? 0 : 14, position: 'relative' }}>
                    {!isLast && (
                      <div style={{ position: 'absolute', left: 7, top: 16, bottom: 0, width: 2, background: 'var(--neutral-200)' }} />
                    )}
                    <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, background: sc2.text, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)' }}>{entry.stage}</div>
                      <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>
                        {new Date(entry.movedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                        · {captainMap[entry.movedBy] || (entry.movedBy.startsWith('ops') ? 'Ops' : entry.movedBy)}
                      </div>
                      {entry.note && <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--neutral-700)', marginTop: 2 }}>"{entry.note}"</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add note */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a note..."
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid var(--neutral-200)', fontSize: 13,
                    fontFamily: 'inherit', outline: 'none', color: 'var(--neutral-900)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--brand-green-mid)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--neutral-200)'}
                />
                <button
                  onClick={handleAddNote}
                  style={{
                    padding: '10px 16px', borderRadius: 10, border: 'none',
                    background: 'var(--brand-green-mid)', color: '#fff',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Move stage */}
            {nextStage && (
              <button
                id={`move-stage-${selected.id}`}
                onClick={() => setShowMoveModal(true)}
                style={{
                  width: '100%', height: 52, borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, var(--brand-green-mid), var(--brand-green))',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 4px 16px rgba(46,168,106,0.3)',
                  transition: 'transform 0.15s',
                }}
                onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Move to {nextStage} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </>
      )}

      {/* Move confirmation modal */}
      {showMoveModal && selected && nextStage && (
        <>
          <div onClick={() => setShowMoveModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '24px 20px 40px',
            animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--neutral-200)', margin: '0 auto 20px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--neutral-900)' }}>
              Move to {nextStage}?
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--neutral-500)' }}>
              {selected.name} will be moved from <b>{selected.currentStage}</b> to <b>{nextStage}</b>
            </p>
            <textarea
              value={moveNote}
              onChange={(e) => setMoveNote(e.target.value)}
              placeholder="Add a note (optional)..."
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                border: '1.5px solid var(--neutral-200)', fontSize: 13,
                fontFamily: 'inherit', outline: 'none', minHeight: 72, resize: 'none',
                marginBottom: 14, boxSizing: 'border-box', color: 'var(--neutral-900)',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowMoveModal(false)}
                style={{ flex: 1, height: 48, borderRadius: 12, border: '1.5px solid var(--neutral-200)', background: 'transparent', fontSize: 14, fontWeight: 700, color: 'var(--neutral-500)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                id="confirm-move-btn"
                onClick={handleMove}
                style={{ flex: 2, height: 48, borderRadius: 12, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Confirm Move →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
