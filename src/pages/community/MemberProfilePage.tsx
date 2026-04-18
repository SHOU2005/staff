import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRole } from '../../contexts/RoleContext';
import {
  fetchMemberById, fetchPostsByAuthor, fetchMemberByCaptain,
  toggleReaction, updateBio, getAvatarColors, getInitials,
  getRegColorStyle, subscribeToSocialFeed, type SocialMember, type SocialPost,
} from '../../lib/social';
import { PostCard } from './FeedPage';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const { captainId, role } = useRole();
  const navigate = useNavigate();
  const [member, setMember] = useState<SocialMember | null>(null);
  const [myPosts, setMyPosts] = useState<SocialPost[]>([]);
  const [me, setMe] = useState<SocialMember | null>(null);
  const [editBio, setEditBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!memberId) return;
    const [m, posts, myProfile] = await Promise.all([
      fetchMemberById(memberId),
      fetchPostsByAuthor(memberId),
      captainId ? fetchMemberByCaptain(captainId) : Promise.resolve(null),
    ]);
    setMember(m);
    setBioText(m?.bio || '');
    setMyPosts(posts);
    setMe(myProfile);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, [memberId]);
  useEffect(() => { const unsub = subscribeToSocialFeed(() => load()); return unsub; }, [memberId]);

  const isSelf = me?.id === memberId;

  const handleSaveBio = async () => {
    if (!memberId) return;
    setSaving(true);
    await updateBio(memberId, bioText.slice(0, 100));
    setSaving(false);
    setEditBio(false);
    toast.success('Bio updated!');
    load();
  };

  const handleReact = async (postId: string, r: 'like' | 'fire' | 'clap') => {
    if (!me) return;
    await toggleReaction(postId, me.id, r);
    load();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-green)' }} />
    </div>
  );

  if (!member) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--neutral-400)' }}>
      <button onClick={() => navigate(-1)} style={{ border: '1.5px solid var(--neutral-200)', borderRadius: 10, background: '#fff', cursor: 'pointer', padding: '8px 16px', fontFamily: 'inherit', fontSize: 13, display: 'block', margin: '0 auto 16px' }}>← वापस</button>
      <div style={{ fontSize: 14 }}>Member नहीं मिला</div>
    </div>
  );

  const avatarCols = getAvatarColors(member.regNumber);
  const regStyle = getRegColorStyle(member.role);
  const STAGE_LABELS: Record<string, string> = {
    Sourced: 'प्रोफाइल मिली', Screening: 'समीक्षा हो रही है',
    Interviewed: 'Interview हुआ', Offered: 'Offer आया है', Placed: 'नौकरी मिल गई ✓',
  };

  return (
    <div style={{ paddingBottom: 20 }}>
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--neutral-600)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 5 }}>← वापस</button>

      {/* Cover + avatar */}
      <div style={{ margin: '-16px -16px 0', position: 'relative' }}>
        <div style={{ height: 80, background: `linear-gradient(135deg, ${avatarCols.bg}, ${avatarCols.text}22)` }} />
        <div style={{ padding: '0 16px', marginTop: -30 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: avatarCols.bg, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: avatarCols.text, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            {getInitials(member.name)}
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.02em' }}>{member.name}</div>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>{member.city.toUpperCase()}, {member.state.toUpperCase()}</div>
          </div>
          {isSelf && (
            <button onClick={() => setEditBio(true)} style={{ border: '1.5px solid var(--neutral-200)', borderRadius: 10, background: '#fff', cursor: 'pointer', padding: '6px 12px', fontSize: 12, fontFamily: 'inherit', fontWeight: 700, color: 'var(--neutral-600)' }}>✏️ Edit</button>
          )}
        </div>

        {/* Reg number + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {member.isVerified && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#E8F5EE', color: '#1A7A4A', fontWeight: 700 }}>✓ Verified</span>}
          {member.role === 'captain' && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#FAEEDA', color: '#854F0B', fontWeight: 700 }}>⚡ Captain</span>}
          <span style={{ border: `1.5px solid ${regStyle.border}`, color: regStyle.color, background: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>
            रजि. क्र.- {member.regNumber}
          </span>
        </div>

        {/* Bio */}
        {editBio ? (
          <div style={{ marginBottom: 14 }}>
            <textarea value={bioText} onChange={e => setBioText(e.target.value.slice(0, 100))} rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--brand-green-mid)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box' }} />
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--neutral-400)', marginBottom: 8 }}>{bioText.length}/100</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditBio(false)} style={{ flex: 1, height: 36, borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
              <button onClick={handleSaveBio} disabled={saving} style={{ flex: 2, height: 36, borderRadius: 10, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p lang="hi" style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--neutral-600)', lineHeight: 1.6 }}>{member.bio || 'No bio yet.'}</p>
        )}

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <a href={`https://wa.me/`} target="_blank" rel="noreferrer" style={{ flex: 1, height: 40, borderRadius: 12, background: '#25D366', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, gap: 6 }}>
            💬 WhatsApp करें
          </a>
          <button onClick={() => {}} style={{ flex: 1, height: 40, borderRadius: 12, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--neutral-700)' }}>
            उनकी पोस्ट देखें
          </button>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {member.jobType && <div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'var(--neutral-100)', color: 'var(--neutral-600)', fontWeight: 600 }}>{member.jobType}</div>}
          {member.city && <div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'var(--neutral-100)', color: 'var(--neutral-600)', fontWeight: 600 }}>{member.city}</div>}
          {member.badges.includes('placed') && <div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: '#E8F5EE', color: '#1A7A4A', fontWeight: 700 }}>✓ Placed</div>}
        </div>

        {/* Hiring stage — only for self */}
        {isSelf && member.role === 'worker' && member.hiringStage && (
          <div style={{ background: 'var(--brand-green-light)', borderRadius: 14, padding: '14px', marginBottom: 18, borderLeft: '4px solid var(--brand-green-mid)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>आपकी स्थिति</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--neutral-900)' }}>{STAGE_LABELS[member.hiringStage] || member.hiringStage}</div>
          </div>
        )}

        {/* Share profile */}
        {isSelf && (
          <div style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 14, padding: '14px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neutral-700)', marginBottom: 10 }}>📤 Share My Profile</div>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Mera Switch profile: ${member.regNumber}\n\nJoin Switch community!`)}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 12, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              📲 WhatsApp par share karein
            </a>
          </div>
        )}

        {/* Posts */}
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--neutral-700)', marginBottom: 12 }}>उनकी पोस्ट ({myPosts.length})</div>
        {myPosts.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--neutral-400)', fontSize: 13 }}>कोई पोस्ट नहीं</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myPosts.map(post => (
            <PostCard key={post.id} post={post} myId={me?.id || ''} myRole={role || 'captain'} onReact={handleReact} onViewDetail={() => navigate(`/captain/community/post/${post.id}`)} onViewMember={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}
