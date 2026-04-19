import { useState, useCallback, useEffect } from 'react';
import { Plus, Edit2, X, Clock, User, Calendar } from 'lucide-react';
import { getJobs, addJob, updateJob, toggleJobActive, type Job, type Urgency } from '../../lib/data';
import toast from 'react-hot-toast';

const SHIFT_OPTIONS = ['Morning (6am–2pm)', 'Evening (2pm–10pm)', 'Night (10pm–6am)', 'Full Day (9am–6pm)', 'Flexible'];
const URGENCY_COLORS: Record<Urgency, { bg: string; color: string }> = {
  high:   { bg: 'var(--danger-light)',  color: 'var(--danger)'  },
  medium: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  low:    { bg: 'var(--success-light)', color: 'var(--success)' },
};

const EMPTY: Partial<Job> = { urgency: 'medium', active: true, openings: 1, filled: 0 };

export default function OpsJobsPage() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [adding, setAdding]   = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm]       = useState<Partial<Job>>(EMPTY);

  const load = useCallback(() => { setJobs(getJobs()); }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k: keyof Job, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.role || !form.location || !form.salaryRange) {
      toast.error('Role, location and salary are required');
      return;
    }
    if (editing) {
      updateJob(editing.id, form);
      toast.success('Job updated!');
      setEditing(null);
    } else {
      addJob({
        role: form.role!, location: form.location!, salaryRange: form.salaryRange!,
        urgency: (form.urgency as Urgency) || 'medium', active: true,
        postedAt: new Date().toISOString(), description: form.description || '',
        openings: form.openings || 1, filled: 0,
        shift: form.shift, requirements: form.requirements,
        deadline: form.deadline, contact: form.contact,
      });
      toast.success('Job posted!');
      setAdding(false);
    }
    setForm(EMPTY);
    load();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid var(--neutral-200)', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', color: 'var(--neutral-900)', background: '#fff', boxSizing: 'border-box',
  };
  const taStyle: React.CSSProperties = { ...inputStyle, height: 80, resize: 'vertical' as const };
  const focus = {
    onFocus: (e: any) => { e.target.style.borderColor = 'var(--brand-green-mid)'; },
    onBlur:  (e: any) => { e.target.style.borderColor = 'var(--neutral-200)'; },
  };
  const label = (text: string) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
      {text}
    </label>
  );

  const FormView = () => (
    <div style={{ background: '#fff', border: '1.5px solid var(--brand-green-mid)', borderRadius: 20, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--neutral-900)' }}>
          {editing ? 'Edit Job' : 'Post New Job'}
        </h3>
        <button onClick={() => { setAdding(false); setEditing(null); setForm(EMPTY); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={18} color="var(--neutral-500)" />
        </button>
      </div>

      {/* Row 1 — Role + Location */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          {label('Job Role *')}
          <input value={form.role || ''} onChange={e => set('role', e.target.value)} placeholder="e.g. Security Guard" style={inputStyle} {...focus} />
        </div>
        <div>
          {label('Location *')}
          <input value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="e.g. DLF Phase 2" style={inputStyle} {...focus} />
        </div>
      </div>

      {/* Row 2 — Salary + Openings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          {label('Salary Range *')}
          <input value={form.salaryRange || ''} onChange={e => set('salaryRange', e.target.value)} placeholder="₹12,000–₹15,000/mo" style={inputStyle} {...focus} />
        </div>
        <div>
          {label('Openings')}
          <input type="number" min={1} value={form.openings || 1} onChange={e => set('openings', Number(e.target.value))} style={inputStyle} {...focus} />
        </div>
      </div>

      {/* Row 3 — Priority + Shift */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          {label('Priority')}
          <select value={form.urgency || 'medium'} onChange={e => set('urgency', e.target.value as Urgency)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
        <div>
          {label('Shift')}
          <select value={form.shift || ''} onChange={e => set('shift', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Select shift</option>
            {SHIFT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row 4 — Deadline + Contact */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          {label('Fill By Date')}
          <input type="date" value={form.deadline || ''} onChange={e => set('deadline', e.target.value)} style={inputStyle} {...focus} />
        </div>
        <div>
          {label('Contact Person')}
          <input value={form.contact || ''} onChange={e => set('contact', e.target.value)} placeholder="Name / phone" style={inputStyle} {...focus} />
        </div>
      </div>

      {/* Requirements */}
      <div style={{ marginBottom: 12 }}>
        {label('Requirements / Skills')}
        <textarea value={form.requirements || ''} onChange={e => set('requirements', e.target.value)} placeholder="e.g. 1 year experience, own bike, ID proof..." style={taStyle} {...focus} />
      </div>

      {/* Description */}
      <div style={{ marginBottom: 16 }}>
        {label('Additional Details')}
        <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Any extra info for captains..." style={taStyle} {...focus} />
      </div>

      <button onClick={handleSubmit} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,var(--brand-green-mid),var(--brand-green))', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(46,168,106,0.25)' }}>
        {editing ? 'Save Changes' : '+ Post Job'}
      </button>
    </div>
  );

  const active = jobs.filter(j => j.active);
  const closed = jobs.filter(j => !j.active);

  const JobCard = ({ job }: { job: Job }) => {
    const urg = URGENCY_COLORS[job.urgency];
    const pct = job.openings > 0 ? Math.round((job.filled / job.openings) * 100) : 0;
    return (
      <div style={{ background: '#fff', border: `1.5px solid ${job.active ? 'var(--neutral-200)' : 'var(--neutral-100)'}`, borderRadius: 18, padding: 16, marginBottom: 10, opacity: job.active ? 1 : 0.65 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--neutral-900)', marginBottom: 2 }}>{job.role}</div>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)' }}>📍 {job.location}</div>
          </div>
          <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: urg.bg, color: urg.color, flexShrink: 0, marginLeft: 8 }}>
            {job.urgency.toUpperCase()}
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[
            { l: 'Salary',   v: job.salaryRange, color: 'var(--brand-green)' },
            { l: 'Openings', v: `${job.filled}/${job.openings}`, color: job.filled >= job.openings ? 'var(--success)' : 'var(--neutral-900)' },
            { l: 'Filled',   v: `${pct}%`, color: pct >= 100 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' },
          ].map(({ l, v, color }) => (
            <div key={l} style={{ padding: '8px 6px', background: 'var(--neutral-50)', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 9, color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Fill progress bar */}
        <div style={{ height: 4, borderRadius: 99, background: 'var(--neutral-100)', marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 99, background: pct >= 100 ? 'var(--success)' : 'var(--brand-green-mid)', transition: 'width 0.4s' }} />
        </div>

        {/* Meta chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {job.shift && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--neutral-600)', background: 'var(--neutral-50)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
              <Clock size={10} /> {job.shift}
            </span>
          )}
          {job.deadline && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--neutral-600)', background: 'var(--neutral-50)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
              <Calendar size={10} /> Fill by {new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {job.contact && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--neutral-600)', background: 'var(--neutral-50)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
              <User size={10} /> {job.contact}
            </span>
          )}
        </div>

        {job.requirements && (
          <div style={{ fontSize: 12, color: 'var(--neutral-600)', marginBottom: 8, lineHeight: 1.5, padding: '8px 10px', background: 'var(--neutral-50)', borderRadius: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--neutral-700)' }}>Requirements: </span>{job.requirements}
          </div>
        )}
        {job.description && (
          <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 10, lineHeight: 1.5 }}>{job.description}</div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setEditing(job); setAdding(false); setForm(job); }}
            style={{ flex: 1, height: 40, borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Edit2 size={12} /> Edit
          </button>
          <button
            onClick={() => { toggleJobActive(job.id); load(); toast.success(job.active ? 'Job closed' : 'Job reopened'); }}
            style={{ flex: 1, height: 40, borderRadius: 10, border: 'none', background: job.active ? 'var(--danger-light)' : 'var(--success-light)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: job.active ? 'var(--danger)' : 'var(--success)' }}
          >
            {job.active ? 'Close' : 'Reopen'}
          </button>
          <button
            onClick={() => {
              const t = `🎯 *Hiring Now!*\n*Role:* ${job.role}\n📍 ${job.location}\n💰 ${job.salaryRange}${job.shift ? `\n⏰ ${job.shift}` : ''}${job.requirements ? `\n✅ ${job.requirements}` : ''}${job.description ? `\n\n${job.description}` : ''}\n\nContact Switch Hiring Team`;
              window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank');
            }}
            style={{ flex: 1, height: 40, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#25D366,#128C7E)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#fff' }}
          >
            Share
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Job Board</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>Job Postings</h1>
          <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>{active.length} active · {closed.length} closed</div>
        </div>
        <button
          id="add-job-btn"
          onClick={() => { setAdding(true); setEditing(null); setForm(EMPTY); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--brand-green-mid)', border: 'none', borderRadius: 12, padding: '10px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(46,168,106,0.25)' }}
        >
          <Plus size={15} /> New Job
        </button>
      </div>

      {(adding || editing) && <FormView />}

      {active.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 18, border: '1.5px dashed var(--neutral-200)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💼</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 6 }}>No active jobs</div>
          <div style={{ fontSize: 13, color: 'var(--neutral-500)', marginBottom: 20 }}>Post a job to let captains start sourcing candidates</div>
          <button onClick={() => setAdding(true)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Post First Job
          </button>
        </div>
      )}

      {active.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Active ({active.length})</div>
          {active.map(j => <JobCard key={j.id} job={j} />)}
        </>
      )}

      {closed.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 20 }}>Closed ({closed.length})</div>
          {closed.map(j => <JobCard key={j.id} job={j} />)}
        </>
      )}
    </div>
  );
}
