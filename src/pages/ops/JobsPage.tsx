import { useState, useCallback, useEffect } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import { getJobs, addJob, updateJob, toggleJobActive, type Job, type Urgency } from '../../lib/data';
import toast from 'react-hot-toast';

export default function OpsJobsPage() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [adding, setAdding]   = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm]       = useState<Partial<Job>>({ urgency:'medium', active:true, openings:1, filled:0 });

  const load = useCallback(() => { setJobs(getJobs()); }, []);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = () => {
    if (!form.role || !form.location || !form.salaryRange) { toast.error('Fill all required fields'); return; }
    if (editing) {
      updateJob(editing.id, form);
      toast.success('Job updated!');
      setEditing(null);
    } else {
      addJob({ ...form, role: form.role!, location: form.location!, salaryRange: form.salaryRange!, urgency: form.urgency as Urgency, active: true, postedAt: new Date().toISOString(), description: form.description||'', openings: form.openings||1, filled: form.filled||0 });
      toast.success('Job posted!');
      setAdding(false);
    }
    setForm({ urgency:'medium', active:true, openings:1, filled:0 });
    load();
  };

  const inputStyle = { width:'100%', height:48, padding:'12px 14px', borderRadius:12, border:'1.5px solid var(--neutral-200)', fontSize:14, fontFamily:'inherit', outline:'none', color:'var(--neutral-900)', background:'#fff', boxSizing:'border-box' as const };
  const focus = { onFocus:(e:any)=>{e.target.style.borderColor='var(--brand-green-mid)'}, onBlur:(e:any)=>{e.target.style.borderColor='var(--neutral-200)'} };

  const FormView = () => (
    <div style={{ background:'#fff', border:'1.5px solid var(--brand-green-mid)', borderRadius:20, padding:18, marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'var(--neutral-900)' }}>{editing ? 'Edit Job' : 'Post New Job'}</h3>
        <button onClick={() => { setAdding(false); setEditing(null); setForm({}); }} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={18} color="var(--neutral-500)"/></button>
      </div>
      {[
        { l:'Job Role *', k:'role',   ph:'e.g. Security Guard' },
        { l:'Location *', k:'location', ph:'e.g. DLF Phase 2' },
        { l:'Salary Range *', k:'salaryRange', ph:'e.g. ₹12,000–₹15,000/mo' },
        { l:'Description',  k:'description', ph:'Brief job description' },
      ].map(({ l, k, ph }) => (
        <div key={k} style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{l}</label>
          <input value={(form as any)[k]||''} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={ph} style={inputStyle} {...focus} />
        </div>
      ))}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Urgency</label>
          <select value={form.urgency||'medium'} onChange={e => setForm({...form, urgency:e.target.value as Urgency})} style={{ ...inputStyle, cursor:'pointer' }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Openings</label>
          <input type="number" min={1} value={form.openings||1} onChange={e=>setForm({...form,openings:Number(e.target.value)})} style={inputStyle} {...focus} />
        </div>
      </div>
      <button onClick={handleSubmit} style={{ width:'100%', height:50, borderRadius:14, border:'none', background:'linear-gradient(135deg,var(--brand-green-mid),var(--brand-green))', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(46,168,106,0.25)' }}>
        {editing ? 'Save Changes' : '+ Post Job'}
      </button>
    </div>
  );

  const active = jobs.filter(j => j.active);
  const closed = jobs.filter(j => !j.active);

  const JobCard = ({ job }: { job: Job }) => (
    <div style={{ background:'#fff', border:`1.5px solid ${job.active?'var(--neutral-200)':'var(--neutral-100)'}`, borderRadius:18, padding:16, marginBottom:10, opacity:job.active?1:0.65 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--neutral-900)', marginBottom:4 }}>{job.role}</div>
          <div style={{ fontSize:12, color:'var(--neutral-500)' }}>📍 {job.location}</div>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0, marginLeft:10 }}>
          <span style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:700, background:job.urgency==='high'?'var(--danger-light)':job.urgency==='medium'?'var(--warning-light)':'var(--success-light)', color:job.urgency==='high'?'var(--danger)':job.urgency==='medium'?'var(--warning)':'var(--success)' }}>
            {job.urgency.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
        {[
          { l:'Salary', v:job.salaryRange, color:'var(--brand-green)' },
          { l:'Openings', v:job.openings, color:'var(--neutral-900)' },
          { l:'Filled', v:job.filled, color:job.filled>=job.openings?'var(--success)':'var(--neutral-900)' },
        ].map(({ l, v, color }) => (
          <div key={l} style={{ padding:'8px', background:'var(--neutral-50)', borderRadius:10, textAlign:'center' }}>
            <div style={{ fontSize:13, fontWeight:800, color, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{v}</div>
            <div style={{ fontSize:9, color:'var(--neutral-500)', fontWeight:700, textTransform:'uppercase', marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      {job.description && <div style={{ fontSize:12, color:'var(--neutral-700)', marginBottom:12, lineHeight:1.5 }}>{job.description}</div>}

      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => { setEditing(job); setAdding(false); setForm(job); }} style={{ flex:1, height:40, borderRadius:10, border:'1.5px solid var(--neutral-200)', background:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, color:'var(--neutral-700)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <Edit2 size={12} /> Edit
        </button>
        <button onClick={() => { toggleJobActive(job.id); load(); toast.success(job.active ? 'Job closed' : 'Job activated'); }} style={{ flex:1, height:40, borderRadius:10, border:'none', background:job.active?'var(--danger-light)':'var(--success-light)', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, color:job.active?'var(--danger)':'var(--success)' }}>
          {job.active ? 'Close Job' : 'Reopen Job'}
        </button>
        <button onClick={() => { const t = `🎯 Hiring Now!\nRole: ${job.role}\n📍 ${job.location}, Gurgaon\n💰 ${job.salaryRange}\n${job.description}\n\nContact Switch Hiring Team`; window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank'); }} style={{ flex:1, height:40, borderRadius:10, border:'none', background:'linear-gradient(135deg,#25D366,#128C7E)', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, color:'#fff' }}>
          Share
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:800, color:'var(--brand-green)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>Job Board</div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'var(--neutral-900)', letterSpacing:'-0.03em' }}>Job Postings</h1>
        </div>
        <button
          id="add-job-btn"
          onClick={() => { setAdding(true); setEditing(null); setForm({ urgency:'medium', active:true, openings:1, filled:0 }); }}
          style={{ display:'flex', alignItems:'center', gap:8, background:'var(--brand-green-mid)', border:'none', borderRadius:12, padding:'10px 16px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(46,168,106,0.25)' }}
        >
          <Plus size={15} /> New Job
        </button>
      </div>

      {(adding || editing) && <FormView />}

      {active.length > 0 && (
        <>
          <div style={{ fontSize:10, fontWeight:800, color:'var(--success)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Active ({active.length})</div>
          {active.map(j => <JobCard key={j.id} job={j} />)}
        </>
      )}

      {closed.length > 0 && (
        <>
          <div style={{ fontSize:10, fontWeight:800, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, marginTop:16 }}>Closed ({closed.length})</div>
          {closed.map(j => <JobCard key={j.id} job={j} />)}
        </>
      )}
    </div>
  );
}
