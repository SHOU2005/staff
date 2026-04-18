import { useState, useEffect, useCallback } from 'react';
import {
  fetchFeed, fetchSocialMembers, deletePost, pinPost, fetchOpsProfile,
  createPost, verifyMember, getAvatarColors, getInitials, timeAgoHindi,
  subscribeToSocialFeed, type SocialPost, type SocialMember,
} from '../../lib/social';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

type SubTab = 'feed' | 'reported' | 'members';

export default function OpsCommunityHubPage() {
  const [subTab, setSubTab] = useState<SubTab>('feed');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [members, setMembers] = useState<SocialMember[]>([]);
  const [officialContent, setOfficialContent] = useState('');
  const [showOfficialCompose, setShowOfficialCompose] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [allPosts, allMembers] = await Promise.all([fetchFeed(), fetchSocialMembers()]);
    setPosts(allPosts);
    setMembers(allMembers.filter(m => m.isActive));
    setLoading(false);
  }, []);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => { const unsub = subscribeToSocialFeed(() => load()); return unsub; }, [load]);

  const reportedPosts = posts.filter(p => p.reported);
  const available     = members.filter(m => m.role === 'worker' && !m.badges.includes('placed'));
  const weekAgo       = Date.now() - 7 * 86400000;
  const weekPosts     = posts.filter(p => new Date(p.postedAt).getTime() > weekAgo);

  const handlePostAsOfficial = async () => {
    if (!officialContent.trim()) { toast.error('कुछ लिखें'); return; }
    const ops = await fetchOpsProfile();
    if (!ops) { toast.error('Ops profile नहीं मिली'); return; }
    setSubmitting(true);
    await createPost(ops, 'official', officialContent.trim());
    setOfficialContent(''); setShowOfficialCompose(false); setSubmitting(false);
    toast.success('✅ Switch Official post published!');
    load();
  };

  const handlePin = async (postId: string, pinned: boolean) => {
    await pinPost(postId, !pinned);
    load();
    toast.success(!pinned ? 'Post pinned!' : 'Unpinned');
  };

  const handleDelete = async (postId: string) => {
    await deletePost(postId);
    load();
    toast.success('Post removed');
  };

  const handleVerify = async (memberId: string, name: string) => {
    await verifyMember(memberId);
    load();
    toast.success(`${name} verified!`);
  };

  const SUBTABS: { value: SubTab; label: string; badge?: number }[] = [
    { value: 'feed',     label: 'Feed' },
    { value: 'reported', label: 'Reported', badge: reportedPosts.length },
    { value: 'members',  label: 'Members' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#D4A017', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ops</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>Community Hub</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { v: members.length,  label: 'Members',    color: 'var(--brand-green)' },
          { v: weekPosts.length, label: 'Posts/week', color: '#185FA5' },
          { v: reportedPosts.length, label: 'Reported', color: '#DC2626' },
          { v: available.length, label: 'Available',  color: '#854F0B' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 14, padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'var(--neutral-500)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Post as Switch Official */}
      <button onClick={() => setShowOfficialCompose(!showOfficialCompose)} style={{ width: '100%', height: 44, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#534AB7,#7C74D4)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        ✅ Post as Switch Official
      </button>

      {showOfficialCompose && (
        <div style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: '14px', marginBottom: 16 }}>
          <textarea value={officialContent} onChange={e => setOfficialContent(e.target.value.slice(0, 500))} placeholder="Switch Official announcement..." rows={4}
            style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 14, resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button onClick={() => setShowOfficialCompose(false)} style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid var(--neutral-200)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handlePostAsOfficial} disabled={submitting} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: '#534AB7', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              {submitting ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Posting...</> : 'Post करें'}
            </button>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--neutral-200)', marginBottom: 14 }}>
        {SUBTABS.map(t => (
          <button key={t.value} onClick={() => setSubTab(t.value)} style={{ padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: subTab === t.value ? 800 : 600, color: subTab === t.value ? 'var(--brand-green)' : 'var(--neutral-500)', borderBottom: `2px solid ${subTab === t.value ? 'var(--brand-green-mid)' : 'transparent'}`, marginBottom: -1, position: 'relative' }}>
            {t.label}
            {t.badge ? <span style={{ marginLeft: 5, background: '#DC2626', color: '#fff', borderRadius: 99, fontSize: 9, padding: '1px 5px', fontWeight: 800 }}>{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-green)' }} /></div>}

      {/* Feed tab */}
      {!loading && subTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.slice(0, 20).map(post => (
            <OpsPostRow key={post.id} post={post} onPin={handlePin} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Reported tab */}
      {!loading && subTab === 'reported' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reportedPosts.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--neutral-400)', fontSize: 13 }}>✅ कोई reported post नहीं</div>}
          {reportedPosts.map(post => (
            <OpsPostRow key={post.id} post={post} onPin={handlePin} onDelete={handleDelete} showReportCount />
          ))}
        </div>
      )}

      {/* Members tab */}
      {!loading && subTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map(member => {
            const av = getAvatarColors(member.regNumber);
            return (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: av.text, flexShrink: 0 }}>
                  {getInitials(member.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)' }}>{member.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>{member.regNumber} · {member.city}</div>
                </div>
                {!member.isVerified
                  ? <button onClick={() => handleVerify(member.id, member.name)} style={{ padding: '4px 10px', borderRadius: 8, border: '1.5px solid var(--brand-green-mid)', background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--brand-green)', fontFamily: 'inherit' }}>✓ Verify</button>
                  : <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: '#E8F5EE', color: '#1A7A4A', fontWeight: 700 }}>✓ Verified</span>
                }
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OpsPostRow({ post, onPin, onDelete, showReportCount }: {
  post: SocialPost;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  showReportCount?: boolean;
}) {
  const av = getAvatarColors(post.authorRegNumber);
  return (
    <div style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: av.text, flexShrink: 0 }}>{getInitials(post.authorName)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{post.authorName}</span>
            <span style={{ fontSize: 10, color: 'var(--neutral-400)' }}>· {timeAgoHindi(post.postedAt)}</span>
            {showReportCount && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: '#FEE2E2', color: '#DC2626', fontWeight: 700, marginLeft: 'auto' }}>{post.reportCount} reports</span>}
            {post.pinned && <span style={{ fontSize: 11 }}>📌</span>}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--neutral-600)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={() => onPin(post.id, post.pinned)} style={{ flex: 1, height: 32, borderRadius: 8, border: '1.5px solid var(--neutral-200)', background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', color: 'var(--neutral-700)' }}>
          {post.pinned ? 'Unpin' : '📌 Pin'}
        </button>
        <button onClick={() => onDelete(post.id)} style={{ flex: 1, height: 32, borderRadius: 8, border: '1.5px solid #FEE2E2', background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', color: '#DC2626' }}>
          🗑️ Remove
        </button>
      </div>
    </div>
  );
}
