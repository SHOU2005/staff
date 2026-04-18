// ─────────────────────────────────────────────────────────────────────────────
//  Switch Social Community — Supabase Data Layer (Realtime)
//  ALL reads/writes go to Supabase. localStorage is only a startup cache.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from './supabase';

// ─── TYPES ─────────────────────────────────────────────────────────────────
export type PostType   = 'job_available' | 'looking_for_job' | 'tip' | 'announcement' | 'success_story' | 'official';
export type MemberRole = 'worker' | 'captain' | 'ops';

export interface SocialMember {
  id:                string;
  linkedCandidateId: string | null;
  linkedCaptainId:   string | null;
  regNumber:         string;
  name:              string;
  jobType:           string;
  city:              string;
  state:             string;
  bio:               string;
  bioHindi:          string;
  role:              MemberRole;
  badges:            string[];
  hiringStage:       string;
  joinedAt:          string;
  postCount:         number;
  isActive:          boolean;
  isMuted:           boolean;
  isVerified:        boolean;
}

export interface SocialPost {
  id:              string;
  authorId:        string;
  authorName:      string;
  authorRegNumber: string;
  authorRole:      MemberRole;
  type:            PostType;
  content:         string;
  photo:           string | null;
  jobDetails:      { role: string; location: string; salary: string; contactWhatsApp: string } | null;
  reactions:       { like: number; fire: number; clap: number };
  commentCount:    number;
  pinned:          boolean;
  featured:        boolean;
  reported:        boolean;
  reportCount:     number;
  postedAt:        string;
  editedAt:        string | null;
}

export interface SocialComment {
  id:              string;
  postId:          string;
  authorId:        string;
  authorName:      string;
  authorRegNumber: string;
  content:         string;
  postedAt:        string;
  reactions:       { like: number };
}

// ─── DB ROW → APP TYPE MAPPERS ───────────────────────────────────────────
function rowToMember(r: any): SocialMember {
  return {
    id:                r.id,
    linkedCandidateId: r.linked_candidate_id,
    linkedCaptainId:   r.linked_captain_id,
    regNumber:         r.reg_number,
    name:              r.name,
    jobType:           r.job_type || '',
    city:              r.city || '',
    state:             r.state || 'Haryana',
    bio:               r.bio || '',
    bioHindi:          r.bio_hindi || '',
    role:              r.role as MemberRole,
    badges:            Array.isArray(r.badges) ? r.badges : JSON.parse(r.badges || '[]'),
    hiringStage:       r.hiring_stage || '',
    joinedAt:          r.joined_at,
    postCount:         r.post_count || 0,
    isActive:          r.is_active ?? true,
    isMuted:           r.is_muted ?? false,
    isVerified:        r.is_verified ?? false,
  };
}

function rowToPost(r: any): SocialPost {
  return {
    id:              r.id,
    authorId:        r.author_id,
    authorName:      r.author_name,
    authorRegNumber: r.author_reg_number,
    authorRole:      r.author_role as MemberRole,
    type:            r.type as PostType,
    content:         r.content,
    photo:           r.photo || null,
    jobDetails:      r.job_details || null,
    reactions:       r.reactions || { like: 0, fire: 0, clap: 0 },
    commentCount:    r.comment_count || 0,
    pinned:          r.pinned ?? false,
    featured:        r.featured ?? false,
    reported:        r.reported ?? false,
    reportCount:     r.report_count || 0,
    postedAt:        r.posted_at,
    editedAt:        r.edited_at || null,
  };
}

function rowToComment(r: any): SocialComment {
  return {
    id:              r.id,
    postId:          r.post_id,
    authorId:        r.author_id,
    authorName:      r.author_name,
    authorRegNumber: r.author_reg_number,
    content:         r.content,
    postedAt:        r.posted_at,
    reactions:       { like: r.likes || 0 },
  };
}

// ─── DISPLAY UTF ───────────────────────────────────────────────────────────
export const POST_TYPE_META: Record<PostType, { label: string; labelEn: string; color: string; bg: string; emoji: string }> = {
  job_available:   { label: 'नौकरी है',        labelEn: 'Job Available',  color: '#1A7A4A', bg: '#E8F5EE', emoji: '💼' },
  looking_for_job: { label: 'नौकरी चाहिए',     labelEn: 'Job Seeking',    color: '#185FA5', bg: '#E6F1FB', emoji: '🙋' },
  tip:             { label: 'सुझाव',           labelEn: 'Tip',            color: '#854F0B', bg: '#FAEEDA', emoji: '💡' },
  announcement:    { label: 'घोषणा',          labelEn: 'Announcement',   color: '#534AB7', bg: '#EEEDFE', emoji: '📢' },
  success_story:   { label: 'सफलता',          labelEn: 'Success Story',  color: '#0F6E56', bg: '#E1F5EE', emoji: '⭐' },
  official:        { label: 'Switch Official', labelEn: 'Switch Official', color: '#534AB7', bg: '#EEEDFE', emoji: '✅' },
};

const BG_COLORS  = ['#E8F5EE','#E6F1FB','#FAEEDA','#EEEDFE','#E1F5EE','#FAECE7'];
const TXT_COLORS = ['#1A7A4A','#185FA5','#854F0B','#534AB7','#0F6E56','#993C1D'];

export function getAvatarColors(regNumber: string): { bg: string; text: string } {
  const num = parseInt(regNumber.replace(/\D/g, ''), 10) || 0;
  const idx = num % 6;
  return { bg: BG_COLORS[idx], text: TXT_COLORS[idx] };
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getRegColorStyle(role: MemberRole): { border: string; color: string } {
  if (role === 'captain') return { border: '#D4A017', color: '#D4A017' };
  if (role === 'ops')     return { border: '#534AB7', color: '#534AB7' };
  return { border: '#DC2626', color: '#DC2626' };
}

export function timeAgoHindi(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1)   return 'अभी';
  if (mins < 60)  return `${mins} मिनट पहले`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} घंटे पहले`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days} दिन पहले`;
  return new Date(dateStr).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
}

export function assignRegNumber(type: MemberRole, index: number): string {
  if (type === 'captain') return `SW-CAP-${String(index + 1).padStart(3, '0')}`;
  if (type === 'ops')     return 'SW-OPS-001';
  return `SW-${String(37001 + index).padStart(6, '0')}`;
}

// ─── REALTIME SUBSCRIPTION ────────────────────────────────────────────────
export function subscribeToSocialFeed(onUpdate: () => void): () => void {
  const channel = supabase.channel('social_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'social_posts' },    onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'social_comments' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'social_members' },  onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' },  onUpdate)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// ─── MEMBER QUERIES ───────────────────────────────────────────────────────
export async function fetchSocialMembers(): Promise<SocialMember[]> {
  const { data } = await supabase.from('social_members').select('*').order('joined_at', { ascending: true });
  return (data || []).map(rowToMember);
}

export async function fetchMemberById(id: string): Promise<SocialMember | null> {
  const { data } = await supabase.from('social_members').select('*').eq('id', id).single();
  return data ? rowToMember(data) : null;
}

export async function fetchMemberByLinkedCandidate(candidateId: string): Promise<SocialMember | null> {
  const { data } = await supabase.from('social_members').select('*').eq('linked_candidate_id', candidateId).maybeSingle();
  return data ? rowToMember(data) : null;
}

export async function fetchMemberByCaptain(captainId: string): Promise<SocialMember | null> {
  const { data } = await supabase.from('social_members').select('*').eq('linked_captain_id', captainId).maybeSingle();
  return data ? rowToMember(data) : null;
}

export async function fetchOpsProfile(): Promise<SocialMember | null> {
  const { data } = await supabase.from('social_members').select('*').eq('role', 'ops').maybeSingle();
  return data ? rowToMember(data) : null;
}

export async function searchSocialMembers(query: string): Promise<SocialMember[]> {
  const q = query.trim();
  if (!q) return fetchSocialMembers();
  const { data } = await supabase
    .from('social_members')
    .select('*')
    .or(`name.ilike.%${q}%,reg_number.ilike.%${q}%,city.ilike.%${q}%,job_type.ilike.%${q}%`)
    .eq('is_active', true)
    .order('joined_at', { ascending: true });
  return (data || []).map(rowToMember);
}

export async function upsertMemberProfile(member: SocialMember): Promise<SocialMember | null> {
  const { data, error } = await supabase.from('social_members').upsert({
    id:                  member.id,
    linked_candidate_id: member.linkedCandidateId,
    linked_captain_id:   member.linkedCaptainId,
    reg_number:          member.regNumber,
    name:                member.name,
    job_type:            member.jobType,
    city:                member.city,
    state:               member.state,
    bio:                 member.bio,
    bio_hindi:           member.bioHindi,
    role:                member.role,
    badges:              member.badges,
    hiring_stage:        member.hiringStage,
    joined_at:           member.joinedAt,
    post_count:          member.postCount,
    is_active:           member.isActive,
    is_muted:            member.isMuted,
    is_verified:         member.isVerified,
  }, { onConflict: 'id' }).select().single();
  if (error) { console.error('upsertMember error', error); return null; }
  return data ? rowToMember(data) : null;
}

export async function updateBio(memberId: string, bio: string): Promise<void> {
  await supabase.from('social_members').update({ bio }).eq('id', memberId);
}

export async function verifyMember(memberId: string): Promise<void> {
  await supabase.from('social_members').update({ is_verified: true }).eq('id', memberId);
}

export async function updateHiringStage(memberId: string, stage: string): Promise<void> {
  await supabase.from('social_members').update({ hiring_stage: stage }).eq('id', memberId);
}

// ─── POST QUERIES ─────────────────────────────────────────────────────────
export async function fetchFeed(type?: PostType): Promise<SocialPost[]> {
  let q = supabase.from('social_posts').select('*').order('pinned', { ascending: false }).order('posted_at', { ascending: false });
  if (type) q = q.eq('type', type);
  const { data } = await q;
  return (data || []).map(rowToPost);
}

export async function fetchPostById(postId: string): Promise<SocialPost | null> {
  const { data } = await supabase.from('social_posts').select('*').eq('id', postId).single();
  return data ? rowToPost(data) : null;
}

export async function fetchPostsByAuthor(authorId: string): Promise<SocialPost[]> {
  const { data } = await supabase.from('social_posts').select('*').eq('author_id', authorId).order('posted_at', { ascending: false });
  return (data || []).map(rowToPost);
}

export async function createPost(author: SocialMember, type: PostType, content: string, jobDetails?: SocialPost['jobDetails']): Promise<SocialPost | null> {
  const id = `swp_${Date.now()}`;
  const { data, error } = await supabase.from('social_posts').insert({
    id,
    author_id:        author.id,
    author_name:      author.name,
    author_reg_number: author.regNumber,
    author_role:      author.role,
    type,
    content,
    job_details:      jobDetails || null,
    reactions:        { like: 0, fire: 0, clap: 0 },
    comment_count:    0,
    pinned:           false,
    featured:         false,
    reported:         false,
    report_count:     0,
    posted_at:        new Date().toISOString(),
  }).select().single();
  if (error) { console.error('createPost error', error); return null; }
  // Increment author post_count
  await supabase.from('social_members').update({ post_count: (author.postCount || 0) + 1 }).eq('id', author.id);
  return data ? rowToPost(data) : null;
}

export async function deletePost(postId: string): Promise<void> {
  await supabase.from('social_posts').delete().eq('id', postId);
  await supabase.from('social_comments').delete().eq('post_id', postId);
}

export async function pinPost(postId: string, pin: boolean): Promise<void> {
  if (pin) {
    // Unpin all first, then pin this one
    await supabase.from('social_posts').update({ pinned: false }).eq('pinned', true);
  }
  await supabase.from('social_posts').update({ pinned: pin }).eq('id', postId);
}

export async function reportPost(postId: string): Promise<void> {
  const { data } = await supabase.from('social_posts').select('report_count').eq('id', postId).single();
  if (!data) return;
  const newCount = (data.report_count || 0) + 1;
  await supabase.from('social_posts').update({ report_count: newCount, reported: newCount >= 3 }).eq('id', postId);
}

// ─── REACTIONS ────────────────────────────────────────────────────────────
export async function toggleReaction(postId: string, memberId: string, reaction: 'like' | 'fire' | 'clap'): Promise<string | null> {
  // Get current user reaction
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('*')
    .eq('post_id', postId)
    .eq('member_id', memberId)
    .maybeSingle();

  const { data: postData } = await supabase.from('social_posts').select('reactions').eq('id', postId).single();
  if (!postData) return null;
  const reactions = { ...postData.reactions };

  if (existing) {
    const prev = existing.reaction as 'like' | 'fire' | 'clap';
    if (prev === reaction) {
      // Remove reaction
      await supabase.from('post_reactions').delete().eq('id', existing.id);
      reactions[prev] = Math.max(0, (reactions[prev] || 0) - 1);
      await supabase.from('social_posts').update({ reactions }).eq('id', postId);
      return null;
    } else {
      // Switch reaction
      reactions[prev] = Math.max(0, (reactions[prev] || 0) - 1);
      reactions[reaction] = (reactions[reaction] || 0) + 1;
      await supabase.from('post_reactions').update({ reaction }).eq('id', existing.id);
      await supabase.from('social_posts').update({ reactions }).eq('id', postId);
      return reaction;
    }
  } else {
    // New reaction
    reactions[reaction] = (reactions[reaction] || 0) + 1;
    await supabase.from('post_reactions').insert({ post_id: postId, member_id: memberId, reaction });
    await supabase.from('social_posts').update({ reactions }).eq('id', postId);
    return reaction;
  }
}

export async function getUserReaction(postId: string, memberId: string): Promise<string | null> {
  const { data } = await supabase.from('post_reactions').select('reaction').eq('post_id', postId).eq('member_id', memberId).maybeSingle();
  return data?.reaction || null;
}

// ─── COMMENTS ─────────────────────────────────────────────────────────────
export async function fetchComments(postId: string): Promise<SocialComment[]> {
  const { data } = await supabase.from('social_comments').select('*').eq('post_id', postId).order('posted_at', { ascending: true });
  return (data || []).map(rowToComment);
}

export async function addComment(postId: string, author: SocialMember, content: string): Promise<SocialComment | null> {
  const id = `swc_${Date.now()}`;
  const { data, error } = await supabase.from('social_comments').insert({
    id,
    post_id:          postId,
    author_id:        author.id,
    author_name:      author.name,
    author_reg_number: author.regNumber,
    content,
    posted_at:        new Date().toISOString(),
    likes:            0,
  }).select().single();
  if (error) { console.error('addComment error', error); return null; }
  // Increment comment_count on post
  const { data: post } = await supabase.from('social_posts').select('comment_count').eq('id', postId).single();
  if (post) await supabase.from('social_posts').update({ comment_count: (post.comment_count || 0) + 1 }).eq('id', postId);
  return data ? rowToComment(data) : null;
}

// ─── AUTO-CREATE MEMBER PROFILE ──────────────────────────────────────────
const BIOS: Record<string, string> = {
  'Security Guard': '4 saal ka security ka anubhav. Mehnat aur imaandari pe vishwas.',
  'Housekeeping': '6 saal se housekeeping mein kaam kar rahi hoon. Clean aur professional.',
  'Driver': 'Purane Gurgaon ka driver. 5+ saal ka commercial vehicle experience.',
  'Cook': 'Ghar aur office dono ki cooking ka experience hai. North Indian specialty.',
  'Helper': 'Mehnat aur lagan se kaam karna meri pehchaan hai.',
};
const BIOS_HI: Record<string, string> = {
  'Security Guard': '4 साल का सुरक्षा का अनुभव। मेहनत और ईमानदारी पर विश्वास।',
  'Housekeeping': '6 साल से हाउसकीपिंग में काम कर रही हूँ।',
  'Driver': '5+ साल का कमर्शियल वाहन चलाने का अनुभव।',
  'Cook': 'घर और ऑफिस दोनों की कुकिंग का अनुभव।',
  'Helper': 'मेहनत और लगन से काम करना मेरी पहचान है।',
};

export async function autoCreateCandidateMember(candidate: { id: string; name: string; jobType: string; location: string; currentStage: string; submittedAt: string }, regIndex: number): Promise<SocialMember | null> {
  // Check if already exists
  const existing = await fetchMemberByLinkedCandidate(candidate.id);
  if (existing) return existing;

  const member: SocialMember = {
    id:                `mem_${candidate.id}`,
    linkedCandidateId: candidate.id,
    linkedCaptainId:   null,
    regNumber:         assignRegNumber('worker', regIndex),
    name:              candidate.name,
    jobType:           candidate.jobType,
    city:              candidate.location,
    state:             'Haryana',
    bio:               BIOS[candidate.jobType] || 'Switch ke zariye behtar naukri ki talaash mein.',
    bioHindi:          BIOS_HI[candidate.jobType] || 'Switch के जरिए नौकरी की तलाश में।',
    role:              'worker',
    badges:            candidate.currentStage === 'Placed' ? ['placed'] : [],
    hiringStage:       candidate.currentStage,
    joinedAt:          candidate.submittedAt || new Date().toISOString(),
    postCount:         0,
    isActive:          true,
    isMuted:           false,
    isVerified:        false,
  };
  return upsertMemberProfile(member);
}

export async function autoCreateCaptainMember(captain: { id: string; name: string }, regIndex: number): Promise<SocialMember | null> {
  const existing = await fetchMemberByCaptain(captain.id);
  if (existing) return existing;

  const member: SocialMember = {
    id:                `mem_cap_${captain.id}`,
    linkedCandidateId: null,
    linkedCaptainId:   captain.id,
    regNumber:         assignRegNumber('captain', regIndex),
    name:              captain.name,
    jobType:           'Placement Agent',
    city:              'Gurgaon',
    state:             'Haryana',
    bio:               `Switch Captain. Main aapko sahi naukri dilane mein help karta/karti hoon.`,
    bioHindi:          'स्विच कैप्टन। मैं आपको सही नौकरी दिलाने में मदद करता/करती हूँ।',
    role:              'captain',
    badges:            ['captain'],
    hiringStage:       '',
    joinedAt:          new Date().toISOString(),
    postCount:         0,
    isActive:          true,
    isMuted:           false,
    isVerified:        true,
  };
  return upsertMemberProfile(member);
}

// ─── SEED DATA (runs once) ────────────────────────────────────────────────
export async function initSocialSeedIfNeeded(): Promise<void> {
  // Check if we already seeded
  const { count } = await supabase.from('social_posts').select('*', { count: 'exact', head: true });
  if ((count || 0) > 0) return; // already seeded

  // Get ops profile
  let opsProfile = await fetchOpsProfile();
  if (!opsProfile) {
    const ops: SocialMember = {
      id: 'mem_ops_001', linkedCandidateId: null, linkedCaptainId: null,
      regNumber: 'SW-OPS-001', name: 'Switch Official',
      jobType: 'Operations', city: 'Gurgaon', state: 'Haryana',
      bio: 'Official Switch Operations team.',
      bioHindi: 'आधिकारिक स्विच टीम।',
      role: 'ops', badges: ['verified', 'official'],
      hiringStage: '', joinedAt: new Date().toISOString(),
      postCount: 0, isActive: true, isMuted: false, isVerified: true,
    };
    opsProfile = await upsertMemberProfile(ops);
  }
  if (!opsProfile) return;

  // Fetch captains from Supabase to create captain profiles
  const { data: captains } = await supabase.from('captains').select('*').order('joined_at', { ascending: true });
  const capMembers: SocialMember[] = [];
  for (const [i, cap] of (captains || []).entries()) {
    const m = await autoCreateCaptainMember({ id: cap.id, name: cap.name }, i);
    if (m) capMembers.push(m);
  }

  // Fetch candidates from Supabase to create worker profiles
  const { data: candidates } = await supabase.from('pipeline_candidates').select('*').order('submitted_at', { ascending: true });
  const workerMembers: SocialMember[] = [];
  for (const [i, c] of (candidates || []).entries()) {
    const m = await autoCreateCandidateMember({
      id: c.id, name: c.name, jobType: c.job_type,
      location: c.location, currentStage: c.current_stage, submittedAt: c.submitted_at,
    }, i);
    if (m) workerMembers.push(m);
  }

  const dAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
  const hAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString();
  const capM = capMembers[0] || opsProfile;
  const cap2M = capMembers[1] || opsProfile;
  const w1 = workerMembers[0] || opsProfile;
  const w2 = workerMembers[1] || opsProfile;
  const w3 = workerMembers[2] || opsProfile;
  const w4 = workerMembers[3] || opsProfile;

  const SEED_POSTS = [
    { id:'swp_seed_01', author_id:opsProfile.id, author_name:opsProfile.name, author_reg_number:opsProfile.regNumber, author_role:'ops', type:'official', content:'स्वागत है Switch Community में! 🎉\nYahan aap naukri dhundh sakte hain, share kar sakte hain, aur apne jaisa logo se judh sakte hain.\nKoi bhi sawaal ho toh hamare Captain se sampark karein.', reactions:{like:47,fire:12,clap:8}, comment_count:5, pinned:true, featured:true, reported:false, report_count:0, posted_at:dAgo(7) },
    { id:'swp_seed_02', author_id:capM.id, author_name:capM.name, author_reg_number:capM.regNumber, author_role:'captain', type:'job_available', content:'Urgent requirement! DLF Phase 2 mein 3 Security Guard chahiye.\nSalary: ₹13,000/mo. Experience: 1+ year. Age: 22-40.\nInterested? Mujhe WhatsApp karein.', job_details:{role:'Security Guard',location:'DLF Phase 2',salary:'₹13,000/mo',contactWhatsApp:'9000000000'}, reactions:{like:24,fire:4,clap:2}, comment_count:3, pinned:false, featured:false, reported:false, report_count:0, posted_at:hAgo(2) },
    { id:'swp_seed_03', author_id:w2.id, author_name:w2.name, author_reg_number:w2.regNumber, author_role:'worker', type:'looking_for_job', content:'Namaste! Main 5 saal se housekeeping ka kaam kar rahi hoon.\nAbhi available hoon. Gurgaon ya Faridabad mein koi opportunity\nho toh zaroor batana. 🙏', reactions:{like:18,fire:1,clap:6}, comment_count:2, pinned:false, featured:false, reported:false, report_count:0, posted_at:hAgo(5) },
    { id:'swp_seed_04', author_id:cap2M.id, author_name:cap2M.name, author_reg_number:cap2M.regNumber, author_role:'captain', type:'tip', content:'Interview tip: Saaf kapde pehno, time par pahuncho,\naur security guard ki job ke liye physical fitness\nka proof rakhna helpful hota hai. All the best! 💪', reactions:{like:32,fire:7,clap:14}, comment_count:2, pinned:false, featured:false, reported:false, report_count:0, posted_at:hAgo(8) },
    { id:'swp_seed_05', author_id:w1.id, author_name:w1.name, author_reg_number:w1.regNumber, author_role:'worker', type:'success_story', content:'Switch ke zariye mujhe DLF Phase 2 mein Security Guard ki naukri mili! Bahut shukriya Switch team aur Captain ji ka. ⭐⭐⭐⭐⭐', reactions:{like:51,fire:19,clap:23}, comment_count:3, pinned:false, featured:false, reported:false, report_count:0, posted_at:dAgo(1) },
    { id:'swp_seed_06', author_id:capM.id, author_name:capM.name, author_reg_number:capM.regNumber, author_role:'captain', type:'job_available', content:'Cyber City mein Housekeeping staff chahiye — 2 posts urgent.\nSalary ₹10,000–₹12,000/mo. WhatsApp karein.', job_details:{role:'Housekeeping',location:'Cyber City',salary:'₹10,000–₹12,000/mo',contactWhatsApp:'9000000000'}, reactions:{like:15,fire:2,clap:3}, comment_count:1, pinned:false, featured:false, reported:false, report_count:0, posted_at:dAgo(2) },
    { id:'swp_seed_07', author_id:w3.id, author_name:w3.name, author_reg_number:w3.regNumber, author_role:'worker', type:'looking_for_job', content:'Main ek experienced driver hoon. 5 saal Gurgaon mein corporate driving ki hai. Any opening ho toh zaroor batao.', reactions:{like:9,fire:0,clap:2}, comment_count:0, pinned:false, featured:false, reported:false, report_count:0, posted_at:dAgo(3) },
    { id:'swp_seed_08', author_id:w4.id, author_name:w4.name, author_reg_number:w4.regNumber, author_role:'worker', type:'success_story', content:'Alhamdulillah! Switch ke through mujhe Udyog Vihar mein cook ki job mili. 3 mahine ho gaye, sab sahi hai. ❤️', reactions:{like:44,fire:16,clap:19}, comment_count:2, pinned:false, featured:false, reported:false, report_count:0, posted_at:dAgo(4) },
  ];

  await supabase.from('social_posts').upsert(SEED_POSTS, { onConflict: 'id' });

  // Seed comments
  const SEED_COMMENTS = [
    { id:'swc_s01', post_id:'swp_seed_02', author_id:w1.id, author_name:w1.name, author_reg_number:w1.regNumber, content:'Mujhe interest hai! Main security guard hoon. WhatsApp karu?', posted_at:hAgo(1.5), likes:3 },
    { id:'swc_s02', post_id:'swp_seed_02', author_id:capM.id, author_name:capM.name, author_reg_number:capM.regNumber, content:'Haan, WhatsApp number pe message karein. Joining urgent hai.', posted_at:hAgo(1), likes:5 },
    { id:'swc_s03', post_id:'swp_seed_03', author_id:capM.id, author_name:capM.name, author_reg_number:capM.regNumber, content:'Koi opportunity aate hi bataunga. Profile acha hai!', posted_at:hAgo(4), likes:4 },
    { id:'swc_s04', post_id:'swp_seed_05', author_id:capM.id, author_name:capM.name, author_reg_number:capM.regNumber, content:'Congratulations! Aise hi mehnat karte rahna ⭐', posted_at:dAgo(0.8), likes:8 },
    { id:'swc_s05', post_id:'swp_seed_05', author_id:opsProfile.id, author_name:opsProfile.name, author_reg_number:opsProfile.regNumber, content:'Yeh sunkar bahut khushi hui! Switch community ka star 🌟', posted_at:dAgo(1), likes:12 },
  ];
  await supabase.from('social_comments').upsert(SEED_COMMENTS, { onConflict: 'id' });
}
