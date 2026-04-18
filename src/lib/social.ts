// ─────────────────────────────────────────────────────────────────────────────
//  Switch Social Community — Data Layer
//  Keys: sw_* (never conflicts with switch_* private-pool keys)
// ─────────────────────────────────────────────────────────────────────────────
import { getCandidates, getCaptains, type Candidate } from './data';

// ─── STORAGE KEYS ──────────────────────────────────────────────────────────
const K = {
  members:   'sw_members',
  posts:     'sw_posts',
  comments:  'sw_comments',
  reactions: 'sw_reactions',  // { [postId]: { [userId]: 'like'|'fire'|'clap' } }
  reported:  'sw_reported',
};

// ─── TYPES ─────────────────────────────────────────────────────────────────
export type PostType = 'job_available' | 'looking_for_job' | 'tip' | 'announcement' | 'success_story' | 'official';
export type MemberRole = 'worker' | 'captain' | 'ops';

export interface SocialMember {
  id:               string;   // 'mem_' + candidateId or captainId
  linkedCandidateId: string | null;
  linkedCaptainId:   string | null;
  regNumber:        string;   // SW-037001 / SW-CAP-001 / SW-OPS-001
  name:             string;
  jobType:          string;
  city:             string;
  state:            string;
  bio:              string;
  bioHindi:         string;
  role:             MemberRole;
  badges:           string[];
  hiringStage:      string;
  joinedAt:         string;
  postCount:        number;
  isActive:         boolean;
  isMuted:          boolean;
  isVerified:       boolean;
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

// ─── GETTERS ───────────────────────────────────────────────────────────────
export function getSocialMembers(): SocialMember[] {
  return JSON.parse(localStorage.getItem(K.members) || '[]');
}
export function getSocialPosts(): SocialPost[] {
  return JSON.parse(localStorage.getItem(K.posts) || '[]');
}
export function getSocialComments(): SocialComment[] {
  return JSON.parse(localStorage.getItem(K.comments) || '[]');
}
export function getUserReactions(): Record<string, Record<string, string>> {
  return JSON.parse(localStorage.getItem(K.reactions) || '{}');
}

// ─── SETTERS ───────────────────────────────────────────────────────────────
function saveMembers(d: SocialMember[]) { localStorage.setItem(K.members, JSON.stringify(d)); }
function savePosts(d: SocialPost[])     { localStorage.setItem(K.posts,   JSON.stringify(d)); }
function saveComments(d: SocialComment[]) { localStorage.setItem(K.comments, JSON.stringify(d)); }
function saveUserReactions(d: Record<string, Record<string, string>>) { localStorage.setItem(K.reactions, JSON.stringify(d)); }

// ─── REGISTRATION NUMBERS ──────────────────────────────────────────────────
export function assignRegNumber(type: MemberRole, index: number): string {
  if (type === 'captain') return `SW-CAP-${String(index + 1).padStart(3, '0')}`;
  if (type === 'ops')     return `SW-OPS-001`;
  return `SW-${String(37001 + index).padStart(6, '0')}`;
}

export function getRegColorStyle(role: MemberRole): { border: string; color: string } {
  if (role === 'captain') return { border: '#D4A017', color: '#D4A017' };
  if (role === 'ops')     return { border: '#534AB7', color: '#534AB7' };
  return { border: '#DC2626', color: '#DC2626' };
}

// ─── AVATAR COLOR ──────────────────────────────────────────────────────────
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

// ─── TIME AGO (Hindi) ──────────────────────────────────────────────────────
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

// ─── POST TYPE META ────────────────────────────────────────────────────────
export const POST_TYPE_META: Record<PostType, { label: string; labelEn: string; color: string; bg: string; emoji: string }> = {
  job_available:   { label: 'नौकरी है',         labelEn: 'Job Available',  color: '#1A7A4A', bg: '#E8F5EE', emoji: '💼' },
  looking_for_job: { label: 'नौकरी चाहिए',      labelEn: 'Job Seeking',    color: '#185FA5', bg: '#E6F1FB', emoji: '🙋' },
  tip:             { label: 'सुझाव',            labelEn: 'Tip',            color: '#854F0B', bg: '#FAEEDA', emoji: '💡' },
  announcement:    { label: 'घोषणा',           labelEn: 'Announcement',   color: '#534AB7', bg: '#EEEDFE', emoji: '📢' },
  success_story:   { label: 'सफलता',           labelEn: 'Success Story',  color: '#0F6E56', bg: '#E1F5EE', emoji: '⭐' },
  official:        { label: 'Switch Official',  labelEn: 'Switch Official', color: '#534AB7', bg: '#EEEDFE', emoji: '✅' },
};

// ─── MEMBER CRUD ───────────────────────────────────────────────────────────
export function getMemberById(id: string): SocialMember | undefined {
  return getSocialMembers().find(m => m.id === id);
}
export function getMemberByLinkedId(candidateId: string): SocialMember | undefined {
  return getSocialMembers().find(m => m.linkedCandidateId === candidateId);
}
export function getMemberByMobile(mobile: string): SocialMember | undefined {
  const clean = mobile.replace(/\D/g, '');
  const cands = getCandidates();
  const cand = cands.find(c => c.mobile.replace(/\D/g, '') === clean);
  if (!cand) return undefined;
  return getMemberByLinkedId(cand.id);
}

export function autoCreateMemberProfile(candidate: Candidate, idx: number): SocialMember {
  const existing = getMemberByLinkedId(candidate.id);
  if (existing) return existing;

  const BIOS: Record<string, string> = {
    'Security Guard': '4 saal ka security ka anubhav. Mehnat aur imaandari pe vishwas.',
    'Housekeeping': '6 saal se housekeeping mein kaam kar rahi hoon. Clean aur professional.',
    'Driver':       'Purane Gurgaon ka driver. 5+ saal ka commercial vehicle experience.',
    'Cook':         'Ghar aur office dono ki cooking ka experience hai. North Indian specialty.',
    'Helper':       'Mehnat aur lagan se kaam karna meri pehchaan hai.',
  };
  const BIOS_HI: Record<string, string> = {
    'Security Guard': '4 साल का सुरक्षा का अनुभव। मेहनत और ईमानदारी पर विश्वास।',
    'Housekeeping': '6 साल से हाउसकीपिंग में काम कर रही हूँ।',
    'Driver':       '5+ साल का कमर्शियल वाहन चलाने का अनुभव।',
    'Cook':         'घर और ऑफिस दोनों की कुकिंग का अनुभव।',
    'Helper':       'मेहनत और लगन से काम करना मेरी पहचान है।',
  };

  const profile: SocialMember = {
    id:                `mem_${candidate.id}`,
    linkedCandidateId: candidate.id,
    linkedCaptainId:   null,
    regNumber:         assignRegNumber('worker', idx),
    name:              candidate.name,
    jobType:           candidate.jobType,
    city:              candidate.location,
    state:             'Haryana',
    bio:               BIOS[candidate.jobType] || 'Switch ke zariye behtar naukri ki talaash mein.',
    bioHindi:          BIOS_HI[candidate.jobType] || 'Switch के जरिए बेहतर नौकरी की तलाश में।',
    role:              'worker',
    badges:            candidate.currentStage === 'Placed' ? ['placed'] : [],
    hiringStage:       candidate.currentStage,
    joinedAt:          candidate.submittedAt,
    postCount:         0,
    isActive:          true,
    isMuted:           false,
    isVerified:        false,
  };

  const members = getSocialMembers();
  members.push(profile);
  saveMembers(members);
  return profile;
}

export function autoCreateCaptainProfile(captainId: string, captainName: string, idx: number): SocialMember {
  const existing = getSocialMembers().find(m => m.linkedCaptainId === captainId);
  if (existing) return existing;

  const profile: SocialMember = {
    id:                `mem_cap_${captainId}`,
    linkedCandidateId: null,
    linkedCaptainId:   captainId,
    regNumber:         assignRegNumber('captain', idx),
    name:              captainName,
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

  const members = getSocialMembers();
  members.push(profile);
  saveMembers(members);
  return profile;
}

export function getMemberProfile(memberId: string): SocialMember | undefined {
  return getSocialMembers().find(m => m.id === memberId);
}

export function updateMemberBio(memberId: string, bio: string, bioHindi?: string) {
  const members = getSocialMembers();
  const idx = members.findIndex(m => m.id === memberId);
  if (idx === -1) return;
  members[idx].bio = bio;
  if (bioHindi !== undefined) members[idx].bioHindi = bioHindi;
  saveMembers(members);
}

export function getMemberForUser(captainId: string | null, candidateId: string | null): SocialMember | undefined {
  if (captainId) return getSocialMembers().find(m => m.linkedCaptainId === captainId);
  if (candidateId) return getSocialMembers().find(m => m.linkedCandidateId === candidateId);
  return getSocialMembers().find(m => m.role === 'ops');
}

export function getOpsProfile(): SocialMember {
  const existing = getSocialMembers().find(m => m.role === 'ops');
  if (existing) return existing;
  const profile: SocialMember = {
    id: 'mem_ops_001', linkedCandidateId: null, linkedCaptainId: null,
    regNumber: 'SW-OPS-001', name: 'Switch Official',
    jobType: 'Operations', city: 'Gurgaon', state: 'Haryana',
    bio: 'Official Switch Operations team. Helping connect workers and employers.',
    bioHindi: 'आधिकारिक स्विच टीम। श्रमिकों और नियोक्ताओं को जोड़ने में मदद करती है।',
    role: 'ops', badges: ['verified', 'official'],
    hiringStage: '', joinedAt: new Date().toISOString(),
    postCount: 0, isActive: true, isMuted: false, isVerified: true,
  };
  const members = getSocialMembers();
  members.unshift(profile);
  saveMembers(members);
  return profile;
}

// ─── POST CRUD ─────────────────────────────────────────────────────────────
export function getSocialFeed(type?: PostType): SocialPost[] {
  const posts = getSocialPosts()
    .filter(p => !type || p.type === type)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  return posts;
}

export function createSocialPost(
  author: SocialMember,
  type: PostType,
  content: string,
  jobDetails?: SocialPost['jobDetails']
): SocialPost {
  const post: SocialPost = {
    id:              `swp_${Date.now()}`,
    authorId:        author.id,
    authorName:      author.name,
    authorRegNumber: author.regNumber,
    authorRole:      author.role,
    type, content,
    photo:           null,
    jobDetails:      jobDetails || null,
    reactions:       { like: 0, fire: 0, clap: 0 },
    commentCount:    0,
    pinned:          false,
    featured:        false,
    reported:        false,
    reportCount:     0,
    postedAt:        new Date().toISOString(),
    editedAt:        null,
  };
  const posts = getSocialPosts();
  posts.unshift(post);
  savePosts(posts);
  // increment author postCount
  const members = getSocialMembers();
  const idx = members.findIndex(m => m.id === author.id);
  if (idx !== -1) { members[idx].postCount++; saveMembers(members); }
  return post;
}

export function deletePost(postId: string) {
  savePosts(getSocialPosts().filter(p => p.id !== postId));
  saveComments(getSocialComments().filter(c => c.postId !== postId));
}

export function pinSocialPost(postId: string, pin: boolean) {
  const posts = getSocialPosts().map(p =>
    p.id === postId ? { ...p, pinned: pin } : pin ? { ...p, pinned: false } : p
  );
  savePosts(posts);
}

export function reportPost(postId: string) {
  const posts = getSocialPosts();
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return;
  posts[idx].reportCount++;
  posts[idx].reported = posts[idx].reportCount >= 3;
  savePosts(posts);
}

// ─── REACTIONS ─────────────────────────────────────────────────────────────
export function toggleReaction(postId: string, userId: string, reaction: 'like' | 'fire' | 'clap') {
  const posts = getSocialPosts();
  const pidx = posts.findIndex(p => p.id === postId);
  if (pidx === -1) return;

  const allReactions = getUserReactions();
  const postReactions = allReactions[postId] || {};
  const current = postReactions[userId];

  if (current === reaction) {
    // undo
    delete postReactions[userId];
    posts[pidx].reactions[reaction] = Math.max(0, posts[pidx].reactions[reaction] - 1);
  } else {
    if (current) {
      posts[pidx].reactions[current as 'like'|'fire'|'clap'] = Math.max(0, posts[pidx].reactions[current as 'like'|'fire'|'clap'] - 1);
    }
    postReactions[userId] = reaction;
    posts[pidx].reactions[reaction]++;
  }
  allReactions[postId] = postReactions;
  savePosts(posts);
  saveUserReactions(allReactions);
}

export function getUserReactionForPost(postId: string, userId: string): 'like' | 'fire' | 'clap' | null {
  const all = getUserReactions();
  return (all[postId]?.[userId] as 'like' | 'fire' | 'clap') || null;
}

// ─── COMMENTS ──────────────────────────────────────────────────────────────
export function getCommentsForPost(postId: string): SocialComment[] {
  return getSocialComments()
    .filter(c => c.postId === postId)
    .sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime());
}

export function addComment(postId: string, author: SocialMember, content: string): SocialComment {
  const comment: SocialComment = {
    id:              `swc_${Date.now()}`,
    postId,
    authorId:        author.id,
    authorName:      author.name,
    authorRegNumber: author.regNumber,
    content,
    postedAt:        new Date().toISOString(),
    reactions:       { like: 0 },
  };
  const comments = getSocialComments();
  comments.push(comment);
  saveComments(comments);
  // Update commentCount on post
  const posts = getSocialPosts();
  const pidx = posts.findIndex(p => p.id === postId);
  if (pidx !== -1) { posts[pidx].commentCount++; savePosts(posts); }
  return comment;
}

// ─── FILTERING HELPERS ─────────────────────────────────────────────────────
export function searchMembers(query: string): SocialMember[] {
  const q = query.toLowerCase().trim();
  if (!q) return getSocialMembers().filter(m => m.isActive && !m.isMuted);
  return getSocialMembers().filter(m =>
    m.isActive &&
    (m.name.toLowerCase().includes(q) ||
     m.regNumber.toLowerCase().includes(q) ||
     m.city.toLowerCase().includes(q) ||
     m.jobType.toLowerCase().includes(q))
  );
}

// ─── SEED DATA ─────────────────────────────────────────────────────────────
export function initSocialSeedData() {
  if (localStorage.getItem('sw_seed_v1')) return;

  const candidates = getCandidates();
  const captains   = getCaptains();
  if (candidates.length === 0) return;

  const dAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
  const hAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString();

  // Create ops profile
  const opsProfile = getOpsProfile();

  // Create captain profiles
  const captainMembers = captains.map((cap, i) => autoCreateCaptainProfile(cap.id, cap.name, i));

  // Create worker profiles (candidates)
  const workerMembers = candidates.map((c, i) => autoCreateMemberProfile(c, i));

  // Seed worker profiles for existing candidates (idempotent)

  // ── SEED POSTS ──────────────────────────────────────────────────────────
  const capM = captainMembers[0] || opsProfile;
  const cap2M = captainMembers[1] || opsProfile;
  const w1 = workerMembers[0] || opsProfile;
  const w2 = workerMembers[1] || opsProfile;
  const w3 = workerMembers[2] || opsProfile;
  const w4 = workerMembers[3] || opsProfile;

  const posts: SocialPost[] = [
    // Pinned official post
    {
      id: 'swp_seed_01', authorId: opsProfile.id, authorName: opsProfile.name,
      authorRegNumber: opsProfile.regNumber, authorRole: 'ops', type: 'official',
      content: 'स्वागत है Switch Community में! 🎉\nYahan aap naukri dhundh sakte hain, share kar sakte hain, aur apne jaisa logo se judh sakte hain.\nKoi bhi sawaal ho toh hamare Captain se sampark karein.',
      photo: null, jobDetails: null,
      reactions: { like: 47, fire: 12, clap: 8 }, commentCount: 5,
      pinned: true, featured: true, reported: false, reportCount: 0,
      postedAt: dAgo(7), editedAt: null,
    },
    // Job available - Captain
    {
      id: 'swp_seed_02', authorId: capM.id, authorName: capM.name,
      authorRegNumber: capM.regNumber, authorRole: 'captain', type: 'job_available',
      content: 'Urgent requirement! DLF Phase 2 mein 3 Security Guard chahiye.\nSalary: ₹13,000/mo. Experience: 1+ year. Age: 22-40.\nInterested? Mujhe WhatsApp karein.',
      photo: null,
      jobDetails: { role: 'Security Guard', location: 'DLF Phase 2', salary: '₹13,000/mo', contactWhatsApp: '9000000000' },
      reactions: { like: 24, fire: 4, clap: 2 }, commentCount: 8,
      pinned: false, featured: false, reported: false, reportCount: 0,
      postedAt: hAgo(2), editedAt: null,
    },
    // Looking for job - worker
    {
      id: 'swp_seed_03', authorId: w2.id, authorName: w2.name,
      authorRegNumber: w2.regNumber, authorRole: 'worker', type: 'looking_for_job',
      content: 'Namaste! Main 5 saal se housekeeping ka kaam kar rahi hoon.\nAbhi available hoon. Gurgaon ya Faridabad mein koi opportunity\nho toh zaroor batana. 🙏',
      photo: null, jobDetails: null,
      reactions: { like: 18, fire: 1, clap: 6 }, commentCount: 3,
      pinned: false, featured: false, reported: false, reportCount: 0,
      postedAt: hAgo(5), editedAt: null,
    },
    // Tip - captain
    {
      id: 'swp_seed_04', authorId: cap2M.id, authorName: cap2M.name,
      authorRegNumber: cap2M.regNumber, authorRole: 'captain', type: 'tip',
      content: 'Interview tip: Saaf kapde pehno, time par pahuncho,\naur security guard ki job ke liye physical fitness\nka proof rakhna helpful hota hai. All the best! 💪',
      photo: null, jobDetails: null,
      reactions: { like: 32, fire: 7, clap: 14 }, commentCount: 4,
      pinned: false, featured: false, reported: false, reportCount: 0,
      postedAt: hAgo(8), editedAt: null,
    },
    // Success story - worker
    {
      id: 'swp_seed_05', authorId: w1.id, authorName: w1.name,
      authorRegNumber: w1.regNumber, authorRole: 'worker', type: 'success_story',
      content: 'Switch ke zariye mujhe DLF Phase 2 mein Security Guard\nki naukri mili! Bahut shukriya Switch team aur\nCaptain ji ka. Sabko ye try karna chahiye. ⭐⭐⭐⭐⭐',
      photo: null, jobDetails: null,
      reactions: { like: 51, fire: 19, clap: 23 }, commentCount: 12,
      pinned: false, featured: false, reported: false, reportCount: 0,
      postedAt: dAgo(1), editedAt: null,
    },
    // More job postings
    {
      id: 'swp_seed_06', authorId: capM.id, authorName: capM.name,
      authorRegNumber: capM.regNumber, authorRole: 'captain', type: 'job_available',
      content: 'Cyber City mein Housekeeping staff chahiye — 2 posts urgent.\nSalary ₹10,000–₹12,000/mo. Female candidates preferred.\nAbhi whatsapp karo.',
      photo: null,
      jobDetails: { role: 'Housekeeping', location: 'Cyber City', salary: '₹10,000–₹12,000/mo', contactWhatsApp: '9000000000' },
      reactions: { like: 15, fire: 2, clap: 3 }, commentCount: 2,
      pinned: false, featured: false, reported: false, reportCount: 0,
      postedAt: dAgo(2), editedAt: null,
    },
    {
      id: 'swp_seed_07', authorId: w3.id, authorName: w3.name,
      authorRegNumber: w3.regNumber, authorRole: 'worker', type: 'looking_for_job',
      content: 'Main ek experienced driver hoon. 5 saal Gurgaon mein\ncorporate driving ki hai. Any opening ho toh jaroor batao.\nLicense: commercial vehicle.',
      photo: null, jobDetails: null,
      reactions: { like: 9, fire: 0, clap: 2 }, commentCount: 1,
      pinned: false, featured: false, reported: false, reportCount: 0,
      postedAt: dAgo(3), editedAt: null,
    },
    {
      id: 'swp_seed_08', authorId: cap2M.id, authorName: cap2M.name,
      authorRegNumber: cap2M.regNumber, authorRole: 'captain', type: 'tip',
      content: 'Naya job start hone se pehle ye zaror karo:\n✓ Employer ka nام aur address likh lo\n✓ Salary payment date confirm karo\n✓ Emergency contact share karo\nApni safety pehle! 🛡️',
      photo: null, jobDetails: null,
      reactions: { like: 28, fire: 5, clap: 11 }, commentCount: 3,
      pinned: false, featured: false, reported: false, reportCount: 0,
      postedAt: dAgo(4), editedAt: null,
    },
    {
      id: 'swp_seed_09', authorId: w4.id, authorName: w4.name,
      authorRegNumber: w4.regNumber, authorRole: 'worker', type: 'success_story',
      content: 'Alhamdulillah! Switch ke through mujhe Udyog Vihar mein\ncook ki job mili. 3 mahine ho gaye, sab sahi chal raha hai.\nSwitch community zindabad! 🍳❤️',
      photo: null, jobDetails: null,
      reactions: { like: 44, fire: 16, clap: 19 }, commentCount: 7,
      pinned: false, featured: false, reported: false, reportCount: 0,
      postedAt: dAgo(5), editedAt: null,
    },
    {
      id: 'swp_seed_10', authorId: capM.id, authorName: capM.name,
      authorRegNumber: capM.regNumber, authorRole: 'captain', type: 'job_available',
      content: 'Manesar mein Helper chahiye — immediate joining.\nSalary: ₹9,000–₹11,000/mo. 12-hour shift.\nInterested candidates DM karein.',
      photo: null,
      jobDetails: { role: 'Helper', location: 'Manesar', salary: '₹9,000–₹11,000/mo', contactWhatsApp: '9000000000' },
      reactions: { like: 11, fire: 1, clap: 0 }, commentCount: 1,
      pinned: false, featured: false, reported: false, reportCount: 0,
      postedAt: dAgo(6), editedAt: null,
    },
  ];

  savePosts(posts);

  // ── SEED COMMENTS ────────────────────────────────────────────────────────
  const comments: SocialComment[] = [
    // On post 02 (job available)
    { id:'swc_s01', postId:'swp_seed_02', authorId:w1.id, authorName:w1.name, authorRegNumber:w1.regNumber, content:'Mujhe interest hai! Main security guard hoon, 3 saal ka experience. WhatsApp karu?', postedAt:hAgo(1.5), reactions:{like:3} },
    { id:'swc_s02', postId:'swp_seed_02', authorId:w3.id, authorName:w3.name, authorRegNumber:w3.regNumber, content:'Kya female candidates ke liye bhi hai?', postedAt:hAgo(1), reactions:{like:1} },
    { id:'swc_s03', postId:'swp_seed_02', authorId:capM.id, authorName:capM.name, authorRegNumber:capM.regNumber, content:'Haan, female candidates bhi apply kar sakti hain. WhatsApp number pe message karein.', postedAt:hAgo(0.8), reactions:{like:5} },
    // On post 03 (looking)
    { id:'swc_s04', postId:'swp_seed_03', authorId:capM.id, authorName:capM.name, authorRegNumber:capM.regNumber, content:'Koi opportunity aate hi bataunga. Profile acha hai!', postedAt:hAgo(4), reactions:{like:4} },
    { id:'swc_s05', postId:'swp_seed_03', authorId:w1.id, authorName:w1.name, authorRegNumber:w1.regNumber, content:'Main bhi dhundh raha hoon. Hum saath mein try kar sakte hain.', postedAt:hAgo(3), reactions:{like:2} },
    // On post 05 (success story)
    { id:'swc_s06', postId:'swp_seed_05', authorId:w2.id, authorName:w2.name, authorRegNumber:w2.regNumber, content:'Bahut badhai ho! Humein bhi inspire kiya aapne 🙏', postedAt:dAgo(0.5), reactions:{like:7} },
    { id:'swc_s07', postId:'swp_seed_05', authorId:capM.id, authorName:capM.name, authorRegNumber:capM.regNumber, content:'Congratulations! Aise hi mehnat karte rahna ⭐', postedAt:dAgo(0.8), reactions:{like:8} },
    { id:'swc_s08', postId:'swp_seed_05', authorId:opsProfile.id, authorName:opsProfile.name, authorRegNumber:opsProfile.regNumber, content:'Yeh sunkar bahut khushi hui! Switch community ka star 🌟', postedAt:dAgo(1), reactions:{like:12} },
  ];
  saveComments(comments);

  localStorage.setItem('sw_seed_v1', 'true');
}
