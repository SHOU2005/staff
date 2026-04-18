import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Check, X } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import {
  getCommunity, createCommunity, renameCommunity,
  setCommunityColor, getPostsForCommunity, reactToPost, pinPost,
  COVER_COLORS, createPost, recalculateCommunityStats, type Community, type CommunityPost,
} from '../../lib/community';
import { getCandidates, timeAgo } from '../../lib/data';
import toast from 'react-hot-toast';

export default function CaptainCommunityPage() {
  const { captainId, captainName } = useRole();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [postContent, setPostContent] = useState('');

  const load = useCallback(() => {
    const comm = getCommunity(captainId);
    if (!comm) {
      setCommunity(null);
    } else {
      recalculateCommunityStats(comm.id);
      setCommunity(getCommunity(captainId) || null);
      setPosts(getPostsForCommunity(comm.id));
    }
  }, [captainId]);

  useEffect(() => { load(); window.addEventListener('switch_data_update', load); return () => window.removeEventListener('switch_data_update', load); }, [load]);

  const handleCreateCommunity = () => {
    createCommunity(captainId, captainName || 'Captain', true);
    load();
  };

  const handleRename = () => {
    if (!community || !nameInput.trim()) return;
    renameCommunity(community.id, nameInput.trim());
    setEditingName(false); load();
    toast.success('Community renamed!');
  };

  const handleColorChange = (color: string) => {
    if (!community) return;
    setCommunityColor(community.id, color);
    setShowColorPicker(false); load();
  };

  const handlePost = () => {
    if (!community || !postContent.trim()) return;
    createPost(community.id, captainId, 'announcement', postContent.trim());
    setPostContent(''); setShowPostComposer(false); load();
    toast.success('Post published!');
  };

  const handleReact = (postId: string, reaction: 'thumbsUp' | 'fire') => {
    reactToPost(postId, reaction); load();
  };

  const handlePin = (postId: string, currentlyPinned: boolean) => {
    if (!community) return;
    pinPost(community.id, currentlyPinned ? null : postId);
    load(); toast.success(currentlyPinned ? 'Post unpinned' : 'Post pinned to top!');
  };

  if (!community) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏘️</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>No community yet</h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--neutral-500)', lineHeight: 1.6 }}>
          Submit your first lead to auto-create your community, or create one now.
        </p>
        {getCandidates().filter((c: any) => c.referredBy === captainId).length > 0 ? (
          <button onClick={handleCreateCommunity} style={{ padding: '12px 28px', borderRadius: 14, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            Create my community ✨
          </button>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--neutral-400)', fontStyle: 'italic' }}>Your community will auto-create when you submit your first lead.</div>
        )}
      </div>
    );
  }

  const pinnedPost = posts.find(p => p.pinned);
  const feedPosts = posts;

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Cover + avatar */}
      <div style={{ margin: '-16px -16px 0', position: 'relative' }}>
        <div style={{ height: 90, background: community.coverColor, position: 'relative' }}>
          <button onClick={() => setShowColorPicker(!showColorPicker)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            🎨 Change color
          </button>
          {showColorPicker && (
            <div style={{ position: 'absolute', top: 40, right: 10, background: '#fff', borderRadius: 14, padding: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', display: 'flex', gap: 8, zIndex: 20 }}>
              {COVER_COLORS.map(c => (
                <button key={c.value} onClick={() => handleColorChange(c.value)} style={{ width: 28, height: 28, borderRadius: '50%', background: c.value, border: community.coverColor === c.value ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 16px', marginTop: -26 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: community.coverColor, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            {community.captainName[0]}
          </div>
        </div>
      </div>

      {/* Name */}
      <div style={{ padding: '10px 16px 0' }}>
        {editingName ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <input value={nameInput} onChange={e => setNameInput(e.target.value)} autoFocus style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--brand-green-mid)', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={handleRename} style={{ background: 'var(--brand-green-mid)', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#fff' }}><Check size={16} /></button>
            <button onClick={() => setEditingName(false)} style={{ background: 'var(--neutral-200)', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        ) : (
          <button onClick={() => { setEditingName(true); setNameInput(community.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>{community.name}</span>
            <Edit2 size={14} color="var(--neutral-400)" />
          </button>
        )}

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 16 }}>
          {[
            { label: `${community.stats.totalMembers} Members`, color: 'var(--brand-green)' },
            { label: `${community.stats.activePlacements} Placed`, color: '#185FA5' },
            { label: `${community.stats.available} Available`, color: '#854F0B' },
            { label: `${community.stats.rehires} Re-hires`, color: '#534AB7' },
          ].map(pill => (
            <div key={pill.label} style={{ padding: '5px 12px', borderRadius: 99, background: '#F5F5F5', fontSize: 11, fontWeight: 700, color: pill.color, whiteSpace: 'nowrap' }}>
              {pill.label}
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
          {[
            { icon: '📣', label: 'Broadcast', action: () => navigate('/captain/community/broadcast') },
            { icon: '📊', label: 'Poll', action: () => navigate('/captain/community/poll') },
            { icon: '👥', label: 'Members', action: () => navigate('/captain/community/members') },
            { icon: '✍️', label: 'Post', action: () => setShowPostComposer(true) },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 16px', borderRadius: 14, border: '1.5px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--neutral-700)', flexShrink: 0, fontFamily: 'inherit' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post composer */}
      {showPostComposer && (
        <div style={{ margin: '0 0 12px', background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 14 }}>
          <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="Share an announcement with your community..." rows={3} style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: 'var(--neutral-900)', resize: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button onClick={() => { setShowPostComposer(false); setPostContent(''); }} style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid var(--neutral-200)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handlePost} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: 'var(--brand-green-mid)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>Post</button>
          </div>
        </div>
      )}

      {/* Pinned post */}
      {pinnedPost && (
        <div style={{ background: '#fff', border: '1.5px solid var(--brand-green)', borderLeft: `4px solid ${community.coverColor}`, borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: community.coverColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>📌 Pinned</div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--neutral-700)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pinnedPost.content}</p>
        </div>
      )}

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {feedPosts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--neutral-400)', fontSize: 13 }}>No posts yet. Share an update or broadcast a job!</div>
        )}
        {feedPosts.map(post => (
          <PostCard key={post.id} post={post} coverColor={community.coverColor} captainName={community.captainName} onReact={handleReact} onPin={handlePin} />
        ))}
      </div>
    </div>
  );
}

function PostCard({ post, coverColor, captainName, onReact, onPin }: {
  post: CommunityPost; coverColor: string; captainName: string;
  onReact: (id: string, r: 'thumbsUp' | 'fire') => void;
  onPin: (id: string, pinned: boolean) => void;
}) {
  const typeIcon = post.type === 'auto_success' ? '🏆' : post.type === 'job' ? '📣' : post.type === 'milestone' ? '🎯' : '📢';

  return (
    <div style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: '14px', position: 'relative' }}>
      {post.pinned && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 12 }}>📌</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {post.autoGenerated ? (
          <div style={{ width: 32, height: 32, borderRadius: 8, background: coverColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: coverColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 800 }}>{captainName[0]}</div>
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)' }}>{post.autoGenerated ? 'Switch · Auto' : captainName}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>{timeAgo(post.postedAt)}</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 16 }}>{typeIcon}</div>
      </div>

      <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--neutral-700)', lineHeight: 1.55 }}>
        {post.content.replace(/\[candidateId:[^\]]+\]/, '')}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onReact(post.id, 'thumbsUp')} style={{ background: '#F5F5F5', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
          👍 {post.reactions.thumbsUp}
        </button>
        <button onClick={() => onReact(post.id, 'fire')} style={{ background: '#F5F5F5', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
          🔥 {post.reactions.fire}
        </button>
        <button onClick={() => onPin(post.id, post.pinned)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--neutral-400)', fontFamily: 'inherit' }}>
          {post.pinned ? 'Unpin' : 'Pin'}
        </button>
      </div>
    </div>
  );
}
