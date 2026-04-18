import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import {
  getMemberForUser, createSocialPost, getAvatarColors, getInitials,
  getRegColorStyle, type PostType,
} from '../../lib/social';
import { getSettings } from '../../lib/data';
import toast from 'react-hot-toast';

const TYPES: { value: PostType; emoji: string; label: string; labelEn: string }[] = [
  { value: 'job_available',   emoji: '💼', label: 'नौकरी है',       labelEn: 'Job available'   },
  { value: 'looking_for_job', emoji: '🙋', label: 'नौकरी चाहिए',  labelEn: 'Job seeking'      },
  { value: 'tip',             emoji: '💡', label: 'सुझाव / टिप्स', labelEn: 'Share a tip'      },
  { value: 'success_story',   emoji: '⭐', label: 'सफलता की कहानी', labelEn: 'Success story'   },
];

export default function ComposePage() {
  const { captainId } = useRole();
  const navigate = useNavigate();
  const settings = getSettings();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<PostType | null>(null);
  const [content, setContent] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobWA, setJobWA] = useState('');

  const me = getMemberForUser(captainId || null, null);
  const MAX = 500;
  const remaining = MAX - content.length;

  const handlePost = () => {
    if (!content.trim()) { toast.error('कुछ लिखें पहले!'); return; }
    if (!me) { toast.error('Profile नहीं मिली'); return; }
    const jobDetails = type === 'job_available' && jobRole && jobLocation
      ? { role: jobRole, location: jobLocation, salary: jobSalary, contactWhatsApp: jobWA }
      : null;
    createSocialPost(me, type!, content.trim(), jobDetails || undefined);
    toast.success('आपकी पोस्ट हो गई! ✓');
    navigate('/captain/community');
  };

  const avatarCols = me ? getAvatarColors(me.regNumber) : { bg: '#E8F5EE', text: '#1A7A4A' };
  const regStyle = me ? getRegColorStyle(me.role) : { border: '#DC2626', color: '#DC2626' };

  const selectStyle = {
    width: '100%', height: 44, padding: '0 12px', borderRadius: 12,
    border: '1.5px solid var(--neutral-200)', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', appearance: 'none' as const, color: 'var(--neutral-900)', background: '#fff',
  };
  const labelStyle = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: 'var(--neutral-500)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => step === 2 ? setStep(1) : navigate(-1)} style={{ border: '1.5px solid var(--neutral-200)', borderRadius: 10, background: '#fff', cursor: 'pointer', padding: '6px 10px', fontSize: 13, fontFamily: 'inherit' }}>← Back</button>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Community</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--neutral-900)' }}>पोस्ट करें</div>
        </div>
      </div>

      {/* Step 1 — pick type */}
      {step === 1 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 16 }}>आप क्या शेयर करना चाहते हैं?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {TYPES.map(t => (
              <button key={t.value} onClick={() => { setType(t.value); setStep(2); }} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                padding: '18px 16px', borderRadius: 16, border: '1.5px solid var(--neutral-200)',
                background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
                onPointerDown={e => (e.currentTarget.style.borderColor = 'var(--brand-green-mid)')}
                onPointerUp={e => (e.currentTarget.style.borderColor = 'var(--neutral-200)')}
              >
                <div style={{ fontSize: 32 }}>{t.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--neutral-900)' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>{t.labelEn}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 2 — write post */}
      {step === 2 && type && (
        <>
          {/* Author chip */}
          {me && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: 'var(--neutral-100)', borderRadius: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarCols.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: avatarCols.text }}>
                {getInitials(me.name)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)' }}>{me.name}</div>
                <span style={{ display: 'inline-block', border: `1.5px solid ${regStyle.border}`, color: regStyle.color, background: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 500 }}>
                  रजि. क्र.- {me.regNumber}
                </span>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 10px', borderRadius: 99, background: '#EEEDFE', color: '#534AB7', fontWeight: 700 }}>
                {TYPES.find(t => t.value === type)?.emoji} {TYPES.find(t => t.value === type)?.label}
              </div>
            </div>
          )}

          {/* Textarea */}
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value.slice(0, MAX))}
              placeholder="आप क्या share करना चाहते हैं?"
              rows={5}
              lang="hi"
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid var(--neutral-200)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box', color: 'var(--neutral-900)' }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, marginTop: 4, color: remaining < 10 ? '#DC2626' : remaining < 50 ? '#D97706' : 'var(--neutral-400)', fontWeight: 500 }}>
              {remaining} शब्द बचे
            </div>
          </div>

          {/* Job details (only for job_available) */}
          {type === 'job_available' && (
            <div style={{ background: 'var(--brand-green-light)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>नौकरी की जानकारी:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Job Type *</label>
                  <div style={{ position: 'relative' }}>
                    <select value={jobRole} onChange={e => setJobRole(e.target.value)} style={selectStyle}>
                      <option value="">Job type चुनें...</option>
                      {settings.jobTypes.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--neutral-400)' }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Location *</label>
                  <div style={{ position: 'relative' }}>
                    <select value={jobLocation} onChange={e => setJobLocation(e.target.value)} style={selectStyle}>
                      <option value="">Location चुनें...</option>
                      {settings.locations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--neutral-400)' }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Salary Range</label>
                  <input value={jobSalary} onChange={e => setJobSalary(e.target.value)} placeholder="₹ 12,000 – 15,000/mo" style={{ ...selectStyle, padding: '0 12px', appearance: undefined }} />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp Number</label>
                  <input value={jobWA} onChange={e => setJobWA(e.target.value)} placeholder="10-digit number" style={{ ...selectStyle, padding: '0 12px', appearance: undefined }} maxLength={10} />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/captain/community')} style={{ flex: 1, height: 50, borderRadius: 14, border: '1.5px solid var(--neutral-200)', background: 'transparent', color: 'var(--neutral-600)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handlePost} disabled={!content.trim()} style={{ flex: 2, height: 50, borderRadius: 14, border: 'none', background: content.trim() ? 'var(--brand-green-mid)' : 'var(--neutral-200)', color: content.trim() ? '#fff' : 'var(--neutral-400)', fontSize: 15, fontWeight: 800, cursor: content.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Post करें →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
