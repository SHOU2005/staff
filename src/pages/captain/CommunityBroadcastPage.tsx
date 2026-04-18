import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import { sendBroadcast, getCommunity } from '../../lib/community';
import { getSettings } from '../../lib/data';
import toast from 'react-hot-toast';

type Step = 1 | 2 | 3;

export default function CommunityBroadcastPage() {
  const { captainId } = useRole();
  const navigate = useNavigate();
  const settings = getSettings();
  const community = getCommunity(captainId);
  const [step, setStep] = useState<Step>(1);
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [message, setMessage] = useState('');
  const [targetMode, setTargetMode] = useState<'all' | 'available'>('all');

  if (!community) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--neutral-400)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏘️</div>
        <p>Create your community first by submitting a lead.</p>
      </div>
    );
  }

  const reach = targetMode === 'all' ? community.stats.totalMembers : community.stats.available;

  const handleSend = () => {
    if (!jobTitle || !location) { toast.error('Please fill job title and location'); return; }
    sendBroadcast(captainId, community.id, jobTitle, location, salary, message, {
      jobTypes: [], availableOnly: targetMode === 'available',
    });
    toast.success(`📣 Broadcast sent to ${reach} members!`);
    navigate('/captain/community');
  };

  const inputStyle = {
    width: '100%', height: 46, padding: '0 12px', borderRadius: 12,
    border: '1.5px solid var(--neutral-200)', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box' as const, color: 'var(--neutral-900)',
  };
  const labelStyle = {
    display: 'block' as const, fontSize: 11, fontWeight: 700 as const,
    color: 'var(--neutral-500)', textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: 6,
  };

  const steps = ['Job Details', 'Audience', 'Preview'];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Broadcast</div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>Send a Job Alert</h1>
        <div style={{ fontSize: 13, color: 'var(--neutral-500)' }}>{community.name} · {community.stats.totalMembers} members</div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 3, background: i + 1 <= step ? 'var(--brand-green-mid)' : 'var(--neutral-200)', borderRadius: 3, marginBottom: 6, transition: 'background 0.3s' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: i + 1 <= step ? 'var(--brand-green)' : 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Job Title *</label>
            <div style={{ position: 'relative' }}>
              <select value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Select job type...</option>
                {settings.jobTypes.map(jt => <option key={jt} value={jt}>{jt}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', pointerEvents: 'none' }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Location *</label>
            <div style={{ position: 'relative' }}>
              <select value={location} onChange={e => setLocation(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Select location...</option>
                {settings.locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', pointerEvents: 'none' }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Salary Range</label>
            <input value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. ₹12,000–₹15,000/mo" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Message <span style={{ color: 'var(--neutral-400)' }}>(max 200 chars)</span></label>
            <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 200))} placeholder="Add a message for your community..." rows={4} style={{ ...inputStyle, height: 'auto', padding: '12px', resize: 'none' }} />
            <div style={{ textAlign: 'right', fontSize: 11, color: message.length > 180 ? 'var(--danger)' : 'var(--neutral-400)', marginTop: 4 }}>{message.length}/200</div>
          </div>
          <button onClick={() => setStep(2)} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            Next: Set Audience →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {[
              { value: 'all', label: `All members (${community.stats.totalMembers})`, desc: 'Send to everyone in your community' },
              { value: 'available', label: `Available workers only (${community.stats.available})`, desc: 'Only members not currently placed' },
            ].map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', background: '#fff', border: `2px solid ${targetMode === opt.value ? 'var(--brand-green-mid)' : 'var(--neutral-200)'}`, borderRadius: 14, cursor: 'pointer' }}>
                <input type="radio" name="target" value={opt.value} checked={targetMode === opt.value} onChange={() => setTargetMode(opt.value as 'all' | 'available')} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--neutral-900)' }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ background: 'var(--brand-green-light)', borderRadius: 12, padding: '12px 14px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--brand-green)', fontWeight: 600 }}>Estimated reach: <strong>{reach} members</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, height: 50, borderRadius: 14, border: '1.5px solid var(--neutral-200)', background: 'transparent', color: 'var(--neutral-600)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
            <button onClick={() => setStep(3)} style={{ flex: 2, height: 50, borderRadius: 14, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Preview →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Preview</div>
          <div style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-green-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>📣</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)' }}>{community.captainName} · Just now</div>
                <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>Broadcast to {reach} members</div>
              </div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--neutral-900)', marginBottom: 4 }}>{jobTitle} — {location}</div>
            {salary && <div style={{ fontSize: 13, color: 'var(--brand-green)', fontWeight: 600, marginBottom: 6 }}>{salary}</div>}
            {message && <div style={{ fontSize: 13, color: 'var(--neutral-600)', lineHeight: 1.5 }}>{message}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, height: 50, borderRadius: 14, border: '1.5px solid var(--neutral-200)', background: 'transparent', color: 'var(--neutral-600)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
            <button onClick={handleSend} style={{ flex: 2, height: 50, borderRadius: 14, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Send broadcast → {reach} members
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
