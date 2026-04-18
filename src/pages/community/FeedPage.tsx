import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Loader2 } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import {
  fetchFeed, toggleReaction, getUserReaction, pinPost,
  reportPost, deletePost, timeAgoHindi, POST_TYPE_META, getAvatarColors,
  getInitials, getRegColorStyle, fetchMemberByCaptain, subscribeToSocialFeed,
  type SocialPost, type SocialMember, type PostType,
} from '../../lib/social';
import toast from 'react-hot-toast';

const FEED_TABS: { value: PostType | 'all'; label: string }[] = [
  { value: 'all',             label: 'सभी पोस्ट' },
  { value: 'job_available',   label: 'नौकरी है' },
  { value: 'looking_for_job', label: 'नौकरी चाहिए' },
  { value: 'tip',             label: 'सुझाव' },
  { value: 'success_story',   label: 'सफलता' },
];

export default function CommunityFeedPage() {
  const { captainId, role } = useRole();
  const navigate = useNavigate();
  const [tab, setTab] = useState<PostType | 'all'>('all');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [me, setMe] = useState<SocialMember | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [feedPosts, myProfile] = await Promise.all([
      fetchFeed(tab === 'all' ? undefined : tab),
      captainId ? fetchMemberByCaptain(captainId) : Promise.resolve(null),
    ]);
    setPosts(feedPosts);
    setMe(myProfile);
    setLoading(false);
  }, [tab, captainId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Realtime subscription
  useEffect(() => {
    const unsub = subscribeToSocialFeed(() => load());
    return unsub;
  }, [load]);

  const handleReact = async (postId: string, reaction: 'like' | 'fire' | 'clap') => {
    if (!me) { toast.error('Login required'); return; }
    await toggleReaction(postId, me.id, reaction);
    load();
  };

  const handleDelete = async (postId: string) => {
    await deletePost(postId);
    load();
    toast.success('Post हटा दी गई');
  };

  const handlePin = async (postId: string, pinned: boolean) => {
    await pinPost(postId, !pinned);
    load();
    toast.success(!pinned ? 'Post पिन हो गई!' : 'Pin हटा दिया');
  };

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Switch</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>Community</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/captain/community/members')} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={16} color="var(--neutral-600)" />
          </button>
          <button style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={16} color="var(--neutral-600)" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid var(--neutral-200)', marginBottom: 14, paddingBottom: 0 }}>
        {FEED_TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} style={{
            padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.value ? 800 : 600,
            color: tab === t.value ? 'var(--brand-green)' : 'var(--neutral-500)',
            borderBottom: `2px solid ${tab === t.value ? 'var(--brand-green-mid)' : 'transparent'}`,
            marginBottom: -1, whiteSpace: 'nowrap', transition: 'all 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-green)' }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--neutral-400)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>अभी तक कोई पोस्ट नहीं</div>
          <div style={{ fontSize: 13 }}>पहले पोस्ट करने वाले बनें!</div>
          <button onClick={() => navigate('/captain/community/compose')} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 12, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            + पोस्ट करें
          </button>
        </div>
      )}

      {/* Feed */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              myId={me?.id || ''}
              myRole={role || 'captain'}
              onReact={handleReact}
              onDelete={handleDelete}
              onPin={handlePin}
              onViewDetail={() => navigate(`/captain/community/post/${post.id}`)}
              onViewMember={() => navigate(`/captain/community/member/${post.authorId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PostCard({ post, myId, myRole, onReact, onDelete, onPin, onViewDetail, onViewMember }: {
  post: SocialPost; myId: string; myRole: string;
  onReact: (id: string, r: 'like' | 'fire' | 'clap') => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  onViewDetail?: () => void;
  onViewMember?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);

  useEffect(() => {
    if (myId) getUserReaction(post.id, myId).then(setMyReaction);
  }, [post.id, myId]);

  const typeMeta = POST_TYPE_META[post.type];
  const avatarCols = getAvatarColors(post.authorRegNumber);
  const regStyle = getRegColorStyle(post.authorRole);
  const isAuthor = post.authorId === myId;
  const canModerate = myRole === 'captain' || myRole === 'ops';
  const waShare = `https://wa.me/?text=${encodeURIComponent(`*Switch Community*\n${post.authorName}: ${post.content}\n\nSwitch app se join karein!`)}`;

  return (
    <div style={{ background: '#fff', border: `1px solid ${post.pinned ? 'var(--brand-green)' : 'var(--neutral-200)'}`, borderRadius: 16, padding: '14px', position: 'relative', borderLeft: post.pinned ? '4px solid var(--brand-green-mid)' : undefined }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <button onClick={onViewMember} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarCols.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: avatarCols.text }}>
            {getInitials(post.authorName)}
          </div>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={onViewMember} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14, fontWeight: 700, color: 'var(--neutral-900)' }}>{post.authorName}</button>
            {post.pinned && <span style={{ fontSize: 11 }}>📌</span>}
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: typeMeta.bg, color: typeMeta.color, fontWeight: 700, marginLeft: 'auto' }}>
              {typeMeta.emoji} {typeMeta.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span style={{ display: 'inline-block', border: `1.5px solid ${regStyle.border}`, color: regStyle.color, background: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 500 }}>
              रजि. क्र.- {post.authorRegNumber}
            </span>
            <span style={{ fontSize: 11, color: 'var(--neutral-400)' }}>· {timeAgoHindi(post.postedAt)}</span>
          </div>
        </div>
        {(isAuthor || canModerate) && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 6px', fontSize: 18, color: 'var(--neutral-400)', lineHeight: 1 }}>⋯</button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, top: 28, background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 160, overflow: 'hidden' }}>
                {isAuthor && onDelete && <button onClick={() => { onDelete(post.id); setShowMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#DC2626', fontFamily: 'inherit', fontWeight: 600 }}>🗑️ Delete</button>}
                {canModerate && onPin && <button onClick={() => { onPin(post.id, post.pinned); setShowMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>{post.pinned ? '📌 Unpin' : '📌 Pin to top'}</button>}
                <button onClick={() => { reportPost(post.id); setShowMenu(false); toast('Report दर्ज किया', { icon: '⚠️' }); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, borderTop: '1px solid var(--neutral-100)' }}>⚠️ Report</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p lang="hi" style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--neutral-700)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {post.content}
      </p>

      {/* Job details */}
      {post.jobDetails && (
        <div style={{ background: 'var(--brand-green-light)', borderRadius: 12, padding: '10px 12px', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-green)' }}>{post.jobDetails.role} — {post.jobDetails.location}</div>
          <div style={{ fontSize: 12, color: 'var(--brand-green)', marginTop: 2 }}>{post.jobDetails.salary}</div>
          {post.jobDetails.contactWhatsApp && (
            <a href={`https://wa.me/91${post.jobDetails.contactWhatsApp}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '6px 12px', borderRadius: 8, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
              💬 WhatsApp पर संपर्क करें
            </a>
          )}
        </div>
      )}

      {/* Reaction bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        {(['like', 'fire', 'clap'] as const).map(r => {
          const emoji = r === 'like' ? '👍' : r === 'fire' ? '🔥' : '👏';
          const active = myReaction === r;
          return (
            <button key={r} onClick={() => onReact(post.id, r)} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8,
              border: `1.5px solid ${active ? 'var(--brand-green-mid)' : 'var(--neutral-200)'}`,
              background: active ? 'var(--brand-green-light)' : '#fff',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              color: active ? 'var(--brand-green)' : 'var(--neutral-600)', fontFamily: 'inherit',
            }}>
              {emoji} {post.reactions[r]}
            </button>
          );
        })}
        <button onClick={onViewDetail} style={{ marginLeft: 2, padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--neutral-500)', fontFamily: 'inherit' }}>
          💬 {post.commentCount}
        </button>
        <a href={waShare} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--neutral-200)', background: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#25D366' }}>
          ↗ Share
        </a>
      </div>
    </div>
  );
}
