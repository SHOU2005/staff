import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRole } from '../../contexts/RoleContext';
import {
  fetchPostById, fetchComments, addComment, toggleReaction,
  fetchMemberByCaptain,
  getAvatarColors, getInitials, getRegColorStyle, timeAgoHindi,
  subscribeToSocialFeed, type SocialPost, type SocialComment, type SocialMember,
} from '../../lib/social';
import { PostCard } from './FeedPage';
import toast from 'react-hot-toast';
import { Send, Loader2 } from 'lucide-react';

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { captainId, role } = useRole();
  const navigate = useNavigate();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [me, setMe] = useState<SocialMember | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!postId) return;
    const [p, cmnts, myProfile] = await Promise.all([
      fetchPostById(postId),
      fetchComments(postId),
      captainId ? fetchMemberByCaptain(captainId) : Promise.resolve(null),
    ]);
    setPost(p);
    setComments(cmnts);
    setMe(myProfile);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, [postId]);
  useEffect(() => { const unsub = subscribeToSocialFeed(() => load()); return unsub; }, [postId]);

  const handleReact = async (pid: string, r: 'like' | 'fire' | 'clap') => {
    if (!me) return;
    await toggleReaction(pid, me.id, r);
    load();
  };

  const handleComment = async () => {
    if (!commentText.trim() || !me || !postId) return;
    const comment = await addComment(postId, me, commentText.trim());
    if (comment) {
      setCommentText('');
      load();
      toast.success('टिप्पणी जोड़ी गई ✓');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-green)' }} />
    </div>
  );

  if (!post) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--neutral-400)' }}>
      <div style={{ fontSize: 40 }}>😕</div>
      <div style={{ marginTop: 8, fontSize: 14 }}>Post नहीं मिली</div>
      <button onClick={() => navigate(-1)} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 10, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← वापस जाएं</button>
    </div>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--neutral-600)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '0 0 14px 0' }}>
        ← Feed पर वापस जाएं
      </button>

      <div style={{ marginBottom: 20 }}>
        <PostCard
          post={post}
          myId={me?.id || ''}
          myRole={role || 'captain'}
          onReact={handleReact}
          onViewDetail={() => {}}
          onViewMember={() => navigate(`/captain/community/member/${post.authorId}`)}
        />
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--neutral-700)', marginBottom: 12 }}>
        💬 {comments.length} टिप्पणियां
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {comments.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--neutral-400)', fontSize: 13 }}>पहली टिप्पणी लिखें!</div>}
        {comments.map(comment => {
          const avatarCols = getAvatarColors(comment.authorRegNumber);
          const regStyle = getRegColorStyle('worker');
          return (
            <div key={comment.id} style={{ display: 'flex', gap: 10, padding: '12px 14px', background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarCols.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: avatarCols.text, flexShrink: 0 }}>
                {getInitials(comment.authorName)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)' }}>{comment.authorName}</span>
                  <span style={{ display: 'inline-block', border: `1.5px solid ${regStyle.border}`, color: regStyle.color, background: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 500 }}>
                    {comment.authorRegNumber}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--neutral-400)', marginLeft: 'auto' }}>{timeAgoHindi(comment.postedAt)}</span>
                </div>
                <p lang="hi" style={{ margin: 0, fontSize: 13, color: 'var(--neutral-700)', lineHeight: 1.5 }}>{comment.content}</p>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--neutral-400)' }}>👍 {comment.reactions.like}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky comment input */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid var(--neutral-200)', padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', zIndex: 40, paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        {me && (
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: getAvatarColors(me.regNumber).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: getAvatarColors(me.regNumber).text, flexShrink: 0 }}>
            {getInitials(me.name)}
          </div>
        )}
        <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()}
          placeholder="टिप्पणी लिखें..." lang="hi"
          style={{ flex: 1, height: 40, padding: '0 12px', borderRadius: 20, border: '1.5px solid var(--neutral-200)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        <button onClick={handleComment} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: commentText.trim() ? 'var(--brand-green-mid)' : 'var(--neutral-200)', cursor: commentText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={16} color={commentText.trim() ? '#fff' : 'var(--neutral-400)'} />
        </button>
      </div>
    </div>
  );
}
