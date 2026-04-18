import { useParams } from 'react-router-dom';
import { getWorkerProfileByMobile } from '../lib/community';

const STAGE_STEPS = ['Received', 'Under review', 'Interview stage', 'Offer pending', 'Placed'];
const STAGE_MAP: Record<string, number> = {
  Sourced:      0,
  Screening:    1,
  Interviewed:  2,
  Offered:      3,
  Placed:       4,
};

export default function WorkerStatusPage() {
  const { mobile } = useParams<{ mobile: string }>();
  const profile = mobile ? getWorkerProfileByMobile(mobile) : undefined;

  if (!profile) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F8FBF9' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>Profile not found</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 1.6 }}>
          We couldn't find an application for this number.<br />
          Please contact your Switch agent for help.
        </p>
      </div>
    );
  }

  const stageIdx = STAGE_MAP[profile.currentStage] ?? 0;
  const formattedDate = new Date(profile.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div style={{ minHeight: '100dvh', background: '#F8FBF9', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 0 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1A7A4A,#0F5C35)', padding: '32px 24px 28px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>Switch</div>
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>नमस्ते, {profile.name.split(' ')[0]} 👋</div>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          Your application<br />status
        </h1>
        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '5px 14px', backdropFilter: 'blur(4px)' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{profile.jobType} · {profile.location}</span>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Status tracker */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1A7A4A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Application Progress</div>
          {STAGE_STEPS.map((step, i) => {
            const isDone = i < stageIdx;
            const isCurrent = i === stageIdx;
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: i < STAGE_STEPS.length - 1 ? 0 : 0, position: 'relative' }}>
                {/* Line */}
                {i < STAGE_STEPS.length - 1 && (
                  <div style={{ position: 'absolute', left: 11, top: 24, width: 2, height: 28, background: isDone ? '#1A7A4A' : '#E5E7EB', zIndex: 0 }} />
                )}
                {/* Dot */}
                <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: isDone ? '#1A7A4A' : isCurrent ? '#1A7A4A' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: isCurrent ? '3px solid #E8F5EE' : 'none', boxSizing: 'border-box', boxShadow: isCurrent ? '0 0 0 3px #1A7A4A' : 'none' }}>
                  {isDone ? <span style={{ color: '#fff', fontSize: 12 }}>✓</span> : isCurrent ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /> : null}
                </div>
                <div style={{ paddingBottom: 24, paddingTop: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: isCurrent ? 800 : isDone ? 600 : 500, color: isDone || isCurrent ? '#1A1A1A' : '#9CA3AF' }}>
                    {step}
                  </div>
                  {isCurrent && <div style={{ fontSize: 11, color: '#1A7A4A', fontWeight: 600, marginTop: 2 }}>● Current stage · {formattedDate}</div>}
                  {isDone && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>✓ Complete</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status message */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '4px solid #1A7A4A' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#1A7A4A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>📋 Status Update</div>
          <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.65 }}>{profile.statusMessage}</p>
        </div>

        {/* WhatsApp contact */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            Questions? Contact your Switch agent on WhatsApp.
          </p>
          <a href={`https://wa.me/`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
            <span>💬</span> Open WhatsApp
          </a>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#9CA3AF' }}>
          Last updated: {formattedDate} · Powered by Switch
        </div>
      </div>
    </div>
  );
}
