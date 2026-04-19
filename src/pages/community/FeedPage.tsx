import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Loader2, PenLine } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import {
  fetchFeed, toggleReaction, getUserReaction, pinPost,
  reportPost, deletePost, timeAgoHindi, POST_TYPE_META, getAvatarColors,
  getInitials, getRegColorStyle, fetchMemberByCaptain, subscribeToSocialFeed,
  type SocialPost, type SocialMember, type PostType,
} from '../../lib/social';
import toast from 'react-hot-toast';

const FEED_TABS: { value: PostType | 'all'; label: string; emoji: string }[] = [
  { value: 'all',             label: 'सभी',       emoji: '🏠' },
  { value: 'job_available',   label: 'नौकरी है',  emoji: '💼' },
  { value: 'looking_for_job', label: 'चाहिए',     emoji: '🙋' },
  { value: 'tip',             label: 'सुझाव',     emoji: '💡' },
  { value: 'success_story',   label: 'सफलता',     emoji: '🏆' },
];

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--neutral-200)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,var(--neutral-200) 25%,var(--neutral-100) 50%,var(--neutral-200) 75%)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: '55%', borderRadius: 6, marginBottom: 8, background: 'var(--neutral-200)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,var(--neutral-200) 25%,var(--neutral-100) 50%,var(--neutral-200) 75%)' }} />
          <div style={{ height: 11, width: '35%', borderRadius: 6, background: 'var(--neutral-200)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,var(--neutral-200) 25%,var(--neutral-100) 50%,var(--neutral-200) 75%)' }} />
        </div>
      </div>
      <div style={{ height: 13, borderRadius: 6, marginBottom: 7, background: 'var(--neutral-200)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,var(--neutral-200) 25%,var(--neutral-100) 50%,var(--neutral-200) 75%)' }} />
      <div style={{ height: 13, width: '80%', borderRadius: 6, background: 'var(--neutral-200)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,var(--neutral-200) 25%,var(--neutral-100) 50%,var(--neutral-200) 75%)' }} />
    </div>
  );
}

export default function CommunityFeedPage() {
  const { captainId, captainName, role } = useRole();
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

  useEffect(() => { setLoading(true); load(); }, [load]);

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

  const initials = captainName ? captainName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'C';

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green-mid)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Switch</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>Community</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/captain/community/jobs')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)', fontFamily: 'inherit' }}
          >
            <Briefcase size={13} /> Jobs
          </button>
          <button
            onClick={() => navigate('/captain/community/members')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)', fontFamily: 'inherit' }}
          >
            <Users size={13} /> Members
          </button>
        </div>
      </div>

      {/* ── Compose card ── */}
      <button
        onClick={() => navigate('/captain/community/compose')}
        style={{
          width: '100%', border: '1.5px solid var(--neutral-200)', borderRadius: 16,
          background: '#fff', padding: '12px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-green-light), rgba(46,168,106,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--brand-green)', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, fontSize: 14, color: 'var(--neutral-400)', fontWeight: 500 }}>
          Share a tip, job, or success story…
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--brand-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <PenLine size={15} color="var(--brand-green)" />
        </div>
      </button>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1.5px solid var(--neutral-200)', marginBottom: 16, scrollbarWidth: 'none' }}>
        {FEED_TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} style={{
            padding: '9px 13px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.value ? 800 : 600,
            color: tab === t.value ? 'var(--brand-green)' : 'var(--neutral-500)',
            borderBottom: `2.5px solid ${tab === t.value ? 'var(--brand-green-mid)' : 'transparent'}`,
            marginBottom: -2, whiteSpace: 'nowrap', transition: 'color 0.2s',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── Loading skeletons ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '56px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>💬</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--neutral-800)', marginBottom: 6 }}>अभी तक कोई पोस्ट नहीं</div>
          <div style={{ fontSize: 13, color: 'var(--neutral-500)', marginBottom: 20 }}>पहले पोस्ट करने वाले बनें!</div>
          <button onClick={() => navigate('/captain/community/compose')} style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #2EA86A, #1A7A4A)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(46,168,106,0.35)' }}>
            + पोस्ट करें
          </button>
        </div>
      )}

      {/* ── Feed ── */}
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

  const typeMeta   = POST_TYPE_META[post.type];
  const avatarCols = getAvatarColors(post.authorRegNumber);
  const regStyle   = getRegColorStyle(post.authorRole);
  const isAuthor   = post.authorId === myId;
  const canMod     = myRole === 'ops';
  const waShare    = `https://wa.me/?text=${encodeURIComponent(`*Switch Community*\n${post.authorName}: ${post.content}\n\nSwitch app se join karein!`)}`;

  const totalReactions = post.reactions.like + post.reactions.fire + post.reactions.clap;

  return (
    <div
      style={{
        background: '#fff',
        border: `1.5px solid ${post.pinned ? 'rgba(46,168,106,0.35)' : 'var(--neutral-200)'}`,
        borderRadius: 18, overflow: 'hidden',
        boxShadow: post.pinned ? '0 2px 12px rgba(46,168,106,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
        borderLeft: post.pinned ? '4px solid var(--brand-green-mid)' : undefined,
      }}
    >
      <div style={{ padding: '14px 16px' }}>
        {/* Pin indicator */}
        {post.pinned && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, fontSize: 11, fontWeight: 700, color: 'var(--brand-green)' }}>
            📌 Pinned post
          </div>
        )}

        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <button onClick={onViewMember} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: `linear-gradient(135deg, ${avatarCols.bg}, ${avatarCols.bg}dd)`,
              border: `2px solid ${avatarCols.text}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: avatarCols.text,
            }}>
              {getInitials(post.authorName)}
            </div>
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={onViewMember} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14, fontWeight: 700, color: 'var(--neutral-900)' }}>
                {post.authorName}
              </button>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: typeMeta.bg, color: typeMeta.color, fontWeight: 700 }}>
                {typeMeta.emoji} {typeMeta.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ display: 'inline-block', border: `1.5px solid ${regStyle.border}`, color: regStyle.color, background: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>
                {post.authorRegNumber}
              </span>
              <span style={{ fontSize: 11, color: 'var(--neutral-400)' }}>{timeAgoHindi(post.postedAt)}</span>
            </div>
          </div>

          {(isAuthor || canMod) && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{ border: 'none', background: 'var(--neutral-100)', borderRadius: 8, cursor: 'pointer', padding: '4px 8px', fontSize: 16, color: 'var(--neutral-500)', lineHeight: 1 }}
              >⋯</button>
              {showMenu && (
                <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 168, overflow: 'hidden' }}>
                  {isAuthor && onDelete && (
                    <button onClick={() => { onDelete(post.id); setShowMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#DC2626', fontFamily: 'inherit', fontWeight: 600 }}>🗑️ Delete post</button>
                  )}
                  {canMod && onPin && (
                    <button onClick={() => { onPin(post.id, post.pinned); setShowMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
                      {post.pinned ? '📌 Unpin' : '📌 Pin to top'}
                    </button>
                  )}
                  <button onClick={() => { reportPost(post.id); setShowMenu(false); toast('Report दर्ज किया', { icon: '⚠️' }); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, borderTop: '1px solid var(--neutral-100)', color: 'var(--neutral-600)' }}>
                    ⚠️ Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <p lang="hi" style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--neutral-800)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
          {post.content}
        </p>

        {/* Job details card */}
        {post.jobDetails && (
          <div style={{ background: 'linear-gradient(135deg, var(--brand-green-light), rgba(46,168,106,0.06))', border: '1px solid rgba(46,168,106,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-green-dark)' }}>{post.jobDetails.role}</div>
            <div style={{ fontSize: 12, color: 'var(--brand-green)', marginTop: 2 }}>📍 {post.jobDetails.location} · 💰 {post.jobDetails.salary}</div>
            {post.jobDetails.contactWhatsApp && (
              <a
                href={`https://wa.me/91${post.jobDetails.contactWhatsApp}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, padding: '7px 14px', borderRadius: 9, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}
              >
                💬 WhatsApp करें
              </a>
            )}
          </div>
        )}
      </div>

      {/* Reaction + action bar */}
      <div style={{ borderTop: '1px solid var(--neutral-100)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--neutral-50)' }}>
        {(['like', 'fire', 'clap'] as const).map(r => {
          const emoji  = r === 'like' ? '👍' : r === 'fire' ? '🔥' : '👏';
          const active = myReaction === r;
          return (
            <button key={r} onClick={() => onReact(post.id, r)} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8,
              border: `1.5px solid ${active ? 'rgba(46,168,106,0.35)' : 'var(--neutral-200)'}`,
              background: active ? 'var(--brand-green-light)' : '#fff',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              color: active ? 'var(--brand-green)' : 'var(--neutral-600)', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}>
              {emoji} {post.reactions[r] > 0 && <span>{post.reactions[r]}</span>}
            </button>
          );
        })}

        <button onClick={onViewDetail} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--neutral-500)', fontFamily: 'inherit' }}>
          💬 {post.commentCount > 0 ? post.commentCount : 'Reply'}
        </button>

        <a href={waShare} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1.5px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.06)', textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#25D366' }}>
          ↗ Share
        </a>
      </div>
    </div>
  );
}
