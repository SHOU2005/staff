// ───────────────────────────────────────────────────────────
//  Switch Captain — Data Layer v2.0
//  localStorage-based: auth + pipeline + earnings + analytics
// ───────────────────────────────────────────────────────────
import { supabase } from './supabase';

// ─── STORAGE KEYS ────────────────────────────────────────────
export const KEYS = {
  role:            'switch_role',
  captainName:     'captain_name',
  captainUPI:      'captain_upi',
  captainId:       'captain_id',
  candidates:      'switch_candidates',
  captains:        'switch_captains',
  notifications:   'switch_notifications',
  jobs:            'switch_jobs',
  settings:        'switch_settings',
  onboardingDone:  'switch_onboarding_done',
  leadExtras:      'switch_lead_extras',
  // Auth keys
  users:           'switch_users',
  session:         'switch_session',
  payouts:         'switch_payouts',
};

// ─── TYPES ───────────────────────────────────────────────────
export type Stage       = 'Sourced' | 'Screening' | 'Interviewed' | 'Offered' | 'Placed';
export type PayoutStatus= 'pending' | 'confirmed' | 'paid';
export type Urgency     = 'low' | 'medium' | 'high';
export type Role        = 'captain' | 'ops';
export type CaptainTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

// ─── AUTH TYPES ───────────────────────────────────────────────
export interface SwitchUser {
  id:        string;
  phone:     string;
  password:  string;   // base64 encoded for demo
  name:      string;
  role:      Role;
  captainId: string;
  joinedAt:  string;
  active:    boolean;
}

export interface Session {
  userId:    string;
  captainId: string;
  role:      Role;
  name:      string;
  phone:     string;
  loginAt:   string;
}

// ─── PIPELINE TYPES ───────────────────────────────────────────
export interface TimelineEntry {
  stage:   Stage;
  movedAt: string;
  movedBy: string;
  note:    string;
}

export interface CandidateNote {
  text:    string;
  addedBy: string;
  addedAt: string;
}

export interface Candidate {
  id:                  string;
  name:                string;
  mobile:              string;
  jobType:             string;
  location:            string;
  currentStage:        Stage;
  referredBy:          string;
  submittedAt:         string;
  placedAt:            string | null;
  guaranteeExpiresAt:  string | null;
  replacementNeeded:   boolean;
  replacementForId?:   string;
  currentJob?:         string;
  payout: {
    amount:   number;
    status:   PayoutStatus;
    paidAt:   string | null;
  };
  timeline: TimelineEntry[];
  notes:    CandidateNote[];
  flagged:  boolean;
  archived: boolean;
}

export interface Captain {
  id:       string;
  name:     string;
  mobile:   string;
  upiId:    string;
  joinedAt: string;
  active:   boolean;
}

export interface Job {
  id:          string;
  role:        string;
  location:    string;
  salaryRange: string;
  urgency:     Urgency;
  postedAt:    string;
  active:      boolean;
  description: string;
  openings:    number;
  filled:      number;
}

export interface Notification {
  id:          string;
  type:        'stage_change' | 'payout' | 'guarantee' | 'new_lead' | 'placement' | 'achievement' | 'sla_alert' | 'followup';
  title:       string;
  body:        string;
  createdAt:   string;
  read:        boolean;
  candidateId?: string;
  forRole?:    Role | 'all';
}

export interface LeadExtra {
  linkedJobId?:  string;
  joiningDate?:  string | null;
  followUpDate?: string | null;
}

export interface PayoutRequest {
  id:          string;
  captainId:   string;
  captainName: string;
  amount:      number;
  upiId:       string;
  requestedAt: string;
  status:      'pending' | 'approved' | 'rejected' | 'paid';
  processedAt: string | null;
  processedBy: string | null;
  note:        string;
  candidateIds: string[];
}

export interface Settings {
  perHireFee:   number;
  guaranteeDays: number;
  jobTypes:     string[];
  locations:    string[];
  slaAlertDays: number;
  opsCode:      string;   // code ops team enters to register as ops
  earningTiers: { upTo: number; amount: number }[];
}

// ─── AUTH HELPERS ─────────────────────────────────────────────
// ─── SUPABASE REALTIME SYNC ────────────────────────────────────
function startRealtimeSync() {
  supabase.channel('realtime:pipeline')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_candidates' }, async () => {
      await syncCandidatesFromSupabase();
      window.dispatchEvent(new Event('switch_data_update'));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, async () => {
      await syncCaptainsFromSupabase();
      window.dispatchEvent(new Event('switch_data_update'));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, async () => {
      await syncJobsFromSupabase();
      window.dispatchEvent(new Event('switch_data_update'));
    })
    .subscribe();
}

async function syncCandidatesFromSupabase() {
  const { data } = await supabase.from('pipeline_candidates').select('*').order('submitted_at', { ascending: false });
  if (!data) return;
  const mapped: Candidate[] = data.map(r => ({
    id: r.id, name: r.name, mobile: r.mobile, jobType: r.job_type, location: r.location,
    currentStage: r.current_stage as Stage, referredBy: r.referred_by || '',
    submittedAt: r.submitted_at, placedAt: r.placed_at, guaranteeExpiresAt: r.guarantee_expires_at,
    replacementNeeded: r.replacement_needed, replacementForId: r.replacement_for_id,
    flagged: r.flagged, archived: r.archived,
    payout: { amount: r.payout_amount, status: r.payout_status as PayoutStatus, paidAt: r.payout_paid_at },
    timeline: r.timeline || [], notes: r.notes || [],
  }));
  saveCandidates(mapped);
  // Merge follow-up/joining/linked-job fields back into LeadExtras
  const extras = getLeadExtras();
  data.forEach(r => {
    if (r.follow_up_date || r.joining_date || r.linked_job_id) {
      extras[r.id] = {
        ...extras[r.id],
        ...(r.follow_up_date  ? { followUpDate: r.follow_up_date }   : {}),
        ...(r.joining_date    ? { joiningDate:  r.joining_date }      : {}),
        ...(r.linked_job_id   ? { linkedJobId:  r.linked_job_id }     : {}),
      };
    }
  });
  saveLeadExtras(extras);
}

async function syncCaptainsFromSupabase() {
  const { data } = await supabase.from('captains').select('*').order('joined_at', { ascending: true });
  if (!data) return;
  const mapped: Captain[] = data.map(r => ({
    id: r.id, name: r.name, mobile: r.mobile, upiId: r.upi_id || '',
    joinedAt: r.joined_at, active: r.active,
  }));
  saveCaptains(mapped);
}

async function syncJobsFromSupabase() {
  const { data } = await supabase.from('jobs').select('*').order('posted_at', { ascending: false });
  if (!data) return;
  const mapped: Job[] = data.map(r => ({
    id: r.id, role: r.role, location: r.location, salaryRange: r.salary_range || '',
    urgency: r.urgency as Urgency, postedAt: r.posted_at, active: r.active,
    description: r.description || '', openings: r.openings, filled: r.filled,
  }));
  saveJobs(mapped);
}

export async function initFromSupabase(): Promise<void> {
  try {
    await Promise.all([
      syncCandidatesFromSupabase(),
      syncCaptainsFromSupabase(),
      syncJobsFromSupabase(),
    ]);
    startRealtimeSync();
    window.dispatchEvent(new Event('switch_data_update'));
  } catch (err) {
    console.warn('Supabase init failed:', err);
  }
}

// ─── AUTH HELPERS (Using Supabase `app_users` table) ────────────
function encodePassword(pwd: string): string {
  return btoa(encodeURIComponent(pwd));
}
function checkPassword(plain: string, encoded: string): boolean {
  try { return btoa(encodeURIComponent(plain)) === encoded; } catch { return false; }
}

export function getSession(): Session | null {
  const s = localStorage.getItem(KEYS.session);
  return s ? JSON.parse(s) : null;
}
export function saveSession(session: Session | null) {
  if (session) localStorage.setItem(KEYS.session, JSON.stringify(session));
  else localStorage.removeItem(KEYS.session);
}

export async function loginUser(phone: string, password: string): Promise<{ ok: boolean; session?: Session; error?: string }> {
  const clean = phone.replace(/\D/g, '');
  const { data, error } = await supabase.from('app_users').select('*').eq('phone', clean).single();
  if (error || !data) return { ok: false, error: 'No account found for this number' };
  if (!data.active) return { ok: false, error: 'Account deactivated. Contact ops team.' };
  if (!checkPassword(password, data.password)) return { ok: false, error: 'Incorrect password' };
  
  const session: Session = {
    userId: data.id, captainId: data.captain_id || 'ops_001', role: data.role,
    name: data.name, phone: data.phone, loginAt: new Date().toISOString(),
  };
  saveSession(session);
  return { ok: true, session };
}

export async function registerCaptain(
  name: string, phone: string, password: string, upiId: string
): Promise<{ ok: boolean; session?: Session; error?: string }> {
  const clean = phone.replace(/\D/g, '');
  const { data: existing } = await supabase.from('app_users').select('id').eq('phone', clean).single();
  if (existing) return { ok: false, error: 'A captain with this number already exists' };
  
  const captainId = `captain_${Date.now()}`;

  // Insert into captains table
  await supabase.from('captains').insert({
    id: captainId, name, mobile: clean, upi_id: upiId,
    joined_at: new Date().toISOString().split('T')[0], active: true,
  });
  
  const { data: user, error } = await supabase.from('app_users').insert({
    phone: clean, password: encodePassword(password), name,
    role: 'captain', captain_id: captainId, active: true
  }).select().single();

  if (error) return { ok: false, error: 'Database error creating user' };

  const captains = getCaptains();
  captains.push({ id: captainId, name, mobile: clean, upiId, joinedAt: new Date().toISOString().split('T')[0], active: true });
  saveCaptains(captains);

  const session: Session = { userId: user.id, captainId, role: 'captain', name, phone: clean, loginAt: new Date().toISOString() };
  saveSession(session);
  return { ok: true, session };
}

export async function registerOps(
  name: string, phone: string, password: string, code: string
): Promise<{ ok: boolean; session?: Session; error?: string }> {
  const settings = getSettings();
  if (code !== settings.opsCode) return { ok: false, error: 'Invalid ops access code' };
  const clean = phone.replace(/\D/g, '');
  
  const { data: existing } = await supabase.from('app_users').select('id').eq('phone', clean).eq('role', 'ops').single();
  if (existing) return { ok: false, error: 'Ops account already exists' };

  const { data: user, error } = await supabase.from('app_users').insert({
    phone: clean, password: encodePassword(password), name, role: 'ops', captain_id: null, active: true
  }).select().single();

  if (error) return { ok: false, error: 'Database error creating user' };

  const session: Session = { userId: user.id, captainId: 'ops_001', role: 'ops', name, phone: clean, loginAt: new Date().toISOString() };
  saveSession(session);
  return { ok: true, session };
}

export async function changePassword(phone: string, oldPwd: string, newPwd: string): Promise<{ ok: boolean; error?: string }> {
  const clean = phone.replace(/\D/g, '');
  const { data } = await supabase.from('app_users').select('*').eq('phone', clean).single();
  if (!data) return { ok: false, error: 'User not found' };
  if (!checkPassword(oldPwd, data.password)) return { ok: false, error: 'Current password incorrect' };
  
  await supabase.from('app_users').update({ password: encodePassword(newPwd) }).eq('id', data.id);
  return { ok: true };
}

export function logout() { saveSession(null); }

export function clearAllLocalData() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  // Also clear community / social keys that live outside KEYS
  ['switch_communities','switch_community_posts','switch_broadcasts',
   'switch_polls','switch_worker_profiles','switch_rehire_log',
   'switch_community_seed_v1','switch_legacy_imported','switch_migration_shourya_3',
  ].forEach(k => localStorage.removeItem(k));
}

// ─── TIERED EARNINGS ──────────────────────────────────────────
export function getEarningRateForPlacementNumber(n: number): number {
  const s = getSettings();
  for (const tier of s.earningTiers) {
    if (n <= tier.upTo) return tier.amount;
  }
  return s.earningTiers[s.earningTiers.length - 1]?.amount ?? 300;
}

export function getTierLabel(total: number): CaptainTier {
  if (total >= 60) return 'Platinum';
  if (total >= 30) return 'Gold';
  if (total >= 10) return 'Silver';
  return 'Bronze';
}

export function getTierConfig(tier: CaptainTier): { color: string; bg: string; icon: string; nextAt: number | null } {
  const configs: Record<CaptainTier, { color: string; bg: string; icon: string; nextAt: number | null }> = {
    Bronze:   { color: '#92400E', bg: '#FEF3C7', icon: '🥉', nextAt: 10  },
    Silver:   { color: '#6B7280', bg: '#F3F4F6', icon: '🥈', nextAt: 30  },
    Gold:     { color: '#D4A017', bg: '#FDF6E3', icon: '🥇', nextAt: 60  },
    Platinum: { color: '#7C3AED', bg: '#EDE9FE', icon: '💎', nextAt: null },
  };
  return configs[tier];
}

// Calculate next placement's payout for a captain
export function getNextPayoutAmount(captainId: string): number {
  const placed = getCandidates().filter(c => c.referredBy === captainId && c.currentStage === 'Placed');
  return getEarningRateForPlacementNumber(placed.length + 1);
}

// ─── GETTERS ──────────────────────────────────────────────────
export function getCandidates(): Candidate[] {
  return JSON.parse(localStorage.getItem(KEYS.candidates) || '[]');
}
export function getCaptains(): Captain[] {
  return JSON.parse(localStorage.getItem(KEYS.captains) || '[]');
}
export function getJobs(): Job[] {
  return JSON.parse(localStorage.getItem(KEYS.jobs) || '[]');
}
export function getNotifications(): Notification[] {
  return JSON.parse(localStorage.getItem(KEYS.notifications) || '[]');
}
export function getPayoutRequests(): PayoutRequest[] {
  return JSON.parse(localStorage.getItem(KEYS.payouts) || '[]');
}

export function getSettings(): Settings {
  const defaults: Settings = {
    perHireFee:   300,
    guaranteeDays: 30,
    slaAlertDays:  7,
    opsCode:       'SWITCH2025',
    jobTypes:     ['Security Guard', 'Housekeeping', 'Driver', 'Cook', 'Helper', 'Other'],
    locations:    [
      'DLF Phase 1','DLF Phase 2','DLF Phase 3','DLF Phase 4','DLF Phase 5',
      'Sohna Road','Golf Course Ext','Cyber City','Udyog Vihar','MG Road',
      'Sector 14','Sector 29','Sector 45','Sector 56','Manesar','Other',
    ],
    earningTiers: [
      { upTo: 30,  amount: 300 },
      { upTo: 60,  amount: 400 },
      { upTo: 9999, amount: 500 },
    ],
  };
  const stored = localStorage.getItem(KEYS.settings);
  return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
}

export function getRole(): Role | null { return (localStorage.getItem(KEYS.role) as Role) || null; }
export function getCaptainId(): string { return localStorage.getItem(KEYS.captainId) || 'captain_001'; }

// ─── SETTERS ─────────────────────────────────────────────────
export function saveCandidates(c: Candidate[]) { localStorage.setItem(KEYS.candidates, JSON.stringify(c)); }
export function saveCaptains(c: Captain[]) { localStorage.setItem(KEYS.captains, JSON.stringify(c)); }
export function saveJobs(j: Job[]) { localStorage.setItem(KEYS.jobs, JSON.stringify(j)); }
export function saveNotifications(n: Notification[]) { localStorage.setItem(KEYS.notifications, JSON.stringify(n)); }
export function savePayoutRequests(p: PayoutRequest[]) { localStorage.setItem(KEYS.payouts, JSON.stringify(p)); }
export function saveSettings(s: Settings) { localStorage.setItem(KEYS.settings, JSON.stringify(s)); }

// ─── CANDIDATE CRUD ───────────────────────────────────────────
export function addCandidate(candidate: Omit<Candidate, 'id'>): Candidate {
  const candidates = getCandidates();
  const newCand: Candidate = { ...candidate, id: `cand_${Date.now()}` };
  saveCandidates([newCand, ...candidates]);
  
  // Push to Supabase pipeline_candidates table
  supabase.from('pipeline_candidates').insert({
    id: newCand.id,
    name: newCand.name,
    mobile: newCand.mobile,
    job_type: newCand.jobType,
    location: newCand.location,
    current_stage: newCand.currentStage,
    referred_by: newCand.referredBy,
    submitted_at: newCand.submittedAt,
    placed_at: newCand.placedAt,
    guarantee_expires_at: newCand.guaranteeExpiresAt,
    replacement_needed: newCand.replacementNeeded,
    replacement_for_id: newCand.replacementForId,
    flagged: newCand.flagged,
    archived: newCand.archived,
    payout_amount: newCand.payout.amount,
    payout_status: newCand.payout.status,
    payout_paid_at: newCand.payout.paidAt,
    timeline: newCand.timeline,
    notes: newCand.notes,
  }).then();

  return newCand;
}

export function updateCandidate(id: string, updates: Partial<Candidate>): Candidate | null {
  const candidates = getCandidates();
  const idx = candidates.findIndex(c => c.id === id);
  if (idx === -1) return null;
  candidates[idx] = { ...candidates[idx], ...updates };
  saveCandidates(candidates);
  // Sync to Supabase
  const u = candidates[idx];
  supabase.from('pipeline_candidates').update({
    current_stage: u.currentStage, placed_at: u.placedAt,
    guarantee_expires_at: u.guaranteeExpiresAt, replacement_needed: u.replacementNeeded,
    flagged: u.flagged, archived: u.archived,
    payout_amount: u.payout.amount, payout_status: u.payout.status, payout_paid_at: u.payout.paidAt,
    timeline: u.timeline, notes: u.notes,
  }).eq('id', id).then();
  return candidates[idx];
}

export function moveCandidateStage(
  id: string, newStage: Stage, movedBy: string, note = ''
): Candidate | null {
  const candidates = getCandidates();
  const idx = candidates.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const candidate = candidates[idx];
  const now = new Date().toISOString();
  const settings = getSettings();

  // Calculate tiered payout if placing
  let payoutAmount = candidate.payout.amount;
  let placedAt = candidate.placedAt;
  let guaranteeExpiresAt = candidate.guaranteeExpiresAt;

  if (newStage === 'Placed' && candidate.currentStage !== 'Placed') {
    // Count existing placements by this captain (excluding this one)
    const placedBefore = candidates.filter(
      c => c.referredBy === candidate.referredBy && c.currentStage === 'Placed' && c.id !== id
    ).length;
    payoutAmount = getEarningRateForPlacementNumber(placedBefore + 1);
    placedAt = now;
    const gDate = new Date(now);
    gDate.setDate(gDate.getDate() + settings.guaranteeDays);
    guaranteeExpiresAt = gDate.toISOString();
  }

  candidates[idx] = {
    ...candidate,
    currentStage:       newStage,
    placedAt,
    guaranteeExpiresAt,
    payout:             newStage === 'Placed' ? { amount: payoutAmount, status: 'pending', paidAt: null } : candidate.payout,
    timeline:           [...candidate.timeline, { stage: newStage, movedAt: now, movedBy, note }],
  };
  saveCandidates(candidates);

  addNotification({
    type: newStage === 'Placed' ? 'placement' : 'stage_change',
    title: `${candidate.name} moved to ${newStage}`,
    body: newStage === 'Placed'
      ? `🎉 Placement confirmed! Earnings: ₹${payoutAmount}`
      : `Stage updated by ops team`,
    candidateId: id, read: false, forRole: 'all',
  });

  return candidates[idx];
}

export function addNoteToCandidate(id: string, text: string, addedBy: string) {
  const candidates = getCandidates();
  const idx = candidates.findIndex(c => c.id === id);
  if (idx === -1) return null;
  candidates[idx].notes.push({ text, addedBy, addedAt: new Date().toISOString() });
  saveCandidates(candidates);
  return candidates[idx];
}

export function archiveCandidate(id: string) { updateCandidate(id, { archived: true }); }

export function markReplacementNeeded(id: string): Candidate | null {
  const candidate = getCandidates().find(c => c.id === id);
  if (!candidate) return null;
  updateCandidate(id, { replacementNeeded: true });
  const { id: _, ...rest } = candidate;
  // Create a new pipeline entry linked to original
  const newCand = addCandidate({
    ...rest,
    currentStage: 'Sourced',
    placedAt: null,
    guaranteeExpiresAt: null,
    replacementNeeded: false,
    replacementForId: id,
    submittedAt: new Date().toISOString(),
    payout: { amount: 0, status: 'pending', paidAt: null },
    timeline: [{ stage: 'Sourced', movedAt: new Date().toISOString(), movedBy: 'ops_001', note: `Replacement for original placement` }],
    notes: [],
    flagged: false,
    archived: false,
  });
  addNotification({
    type: 'stage_change',
    title: `Replacement needed: ${candidate.name}`,
    body: `Replacement candidate entry created`,
    candidateId: newCand.id, read: false, forRole: 'ops',
  });
  return newCand;
}

export function checkDuplicate(mobile: string, excludeId?: string): Candidate | null {
  return getCandidates().find(c => c.mobile === mobile && c.id !== excludeId && !c.archived) || null;
}

// ─── PAYOUT REQUESTS ─────────────────────────────────────────
export function createPayoutRequest(
  captainId: string, captainName: string, upiId: string
): PayoutRequest | null {
  const candidates = getCandidates();
  const pendingCands = candidates.filter(
    c => c.referredBy === captainId && c.payout.status === 'pending' && c.currentStage === 'Placed'
  );
  if (pendingCands.length === 0) return null;
  const amount = pendingCands.reduce((s, c) => s + c.payout.amount, 0);
  const req: PayoutRequest = {
    id: `payout_${Date.now()}`,
    captainId, captainName, amount, upiId,
    requestedAt: new Date().toISOString(),
    status: 'pending', processedAt: null, processedBy: null,
    note: '',
    candidateIds: pendingCands.map(c => c.id),
  };
  const requests = getPayoutRequests();
  savePayoutRequests([req, ...requests]);
  // Mark candidate payouts as 'confirmed'
  pendingCands.forEach(c => updateCandidate(c.id, { payout: { ...c.payout, status: 'confirmed' } }));
  addNotification({
    type: 'payout', title: `Payout request from ${captainName}`,
    body: `₹${amount.toLocaleString('en-IN')} requested via ${upiId}`,
    read: false, forRole: 'ops',
  });
  return req;
}

export function approvePayoutRequest(id: string, processedBy: string): PayoutRequest | null {
  const requests = getPayoutRequests();
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) return null;
  const req = requests[idx];
  requests[idx] = { ...req, status: 'paid', processedAt: new Date().toISOString(), processedBy };
  savePayoutRequests(requests);
  // Mark candidate payouts as paid
  req.candidateIds.forEach(cid => {
    const cand = getCandidates().find(c => c.id === cid);
    if (cand) updateCandidate(cid, { payout: { ...cand.payout, status: 'paid', paidAt: new Date().toISOString() } });
  });
  addNotification({
    type: 'payout', title: `Payout ₹${req.amount.toLocaleString('en-IN')} approved!`,
    body: `Transferred to ${req.upiId}`,
    read: false, forRole: 'captain',
  });
  return requests[idx];
}

export function rejectPayoutRequest(id: string, processedBy: string, note: string): PayoutRequest | null {
  const requests = getPayoutRequests();
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], status: 'rejected', processedAt: new Date().toISOString(), processedBy, note };
  savePayoutRequests(requests);
  // Revert to pending
  requests[idx].candidateIds.forEach(cid => {
    const cand = getCandidates().find(c => c.id === cid);
    if (cand) updateCandidate(cid, { payout: { ...cand.payout, status: 'pending' } });
  });
  return requests[idx];
}

// ─── JOBS CRUD ────────────────────────────────────────────────
export function addJob(job: Omit<Job, 'id'>): Job {
  const jobs = getJobs();
  const newJob: Job = { ...job, id: `job_${Date.now()}` };
  saveJobs([newJob, ...jobs]);
  supabase.from('jobs').insert({
    id: newJob.id, role: newJob.role, location: newJob.location,
    salary_range: newJob.salaryRange, urgency: newJob.urgency,
    posted_at: newJob.postedAt, active: newJob.active,
    description: newJob.description, openings: newJob.openings, filled: newJob.filled,
  }).then();
  return newJob;
}

export function updateJob(id: string, updates: Partial<Job>): Job | null {
  const jobs = getJobs();
  const idx = jobs.findIndex(j => j.id === id);
  if (idx === -1) return null;
  jobs[idx] = { ...jobs[idx], ...updates };
  saveJobs(jobs);
  const j = jobs[idx];
  supabase.from('jobs').update({
    role: j.role, location: j.location, salary_range: j.salaryRange,
    urgency: j.urgency, active: j.active, description: j.description,
    openings: j.openings, filled: j.filled,
  }).eq('id', id).then();
  return j;
}

export function toggleJobActive(id: string): Job | null {
  const jobs = getJobs();
  const job = jobs.find(j => j.id === id);
  if (!job) return null;
  return updateJob(id, { active: !job.active });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────
export function addNotification(notif: Omit<Notification, 'id' | 'createdAt'>) {
  const notifications = getNotifications();
  const n: Notification = { ...notif, id: `notif_${Date.now()}_${Math.random()}`, createdAt: new Date().toISOString() };
  saveNotifications([n, ...notifications].slice(0, 100));
  return n;
}
export function markNotificationRead(id: string) {
  const notifications = getNotifications();
  const idx = notifications.findIndex(n => n.id === id);
  if (idx !== -1) { notifications[idx].read = true; saveNotifications(notifications); }
}
export function markAllRead() {
  saveNotifications(getNotifications().map(n => ({ ...n, read: true })));
}
export function getUnreadCount(role?: Role): number {
  return getNotifications().filter(n => !n.read && (!role || !n.forRole || n.forRole === role || n.forRole === 'all')).length;
}

// ─── LEAD EXTRAS (follow-up, joining date, linked job) ────────
export function getLeadExtras(): Record<string, LeadExtra> {
  const raw = localStorage.getItem(KEYS.leadExtras);
  return raw ? JSON.parse(raw) : {};
}
export function saveLeadExtras(extras: Record<string, LeadExtra>) {
  localStorage.setItem(KEYS.leadExtras, JSON.stringify(extras));
}
export function setLeadExtra(candidateId: string, extra: Partial<LeadExtra>) {
  const all = getLeadExtras();
  all[candidateId] = { ...all[candidateId], ...extra };
  saveLeadExtras(all);
  supabase.from('pipeline_candidates').update({
    ...(extra.followUpDate !== undefined ? { follow_up_date: extra.followUpDate || null } : {}),
    ...(extra.joiningDate  !== undefined ? { joining_date:   extra.joiningDate  || null } : {}),
    ...(extra.linkedJobId  !== undefined ? { linked_job_id:  extra.linkedJobId  || null } : {}),
  }).eq('id', candidateId).then();
}
export function getLeadExtra(candidateId: string): LeadExtra {
  return getLeadExtras()[candidateId] || {};
}

export function getFollowUpsDue(captainId: string): Array<Candidate & { extra: LeadExtra; overdue: boolean }> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const extras = getLeadExtras();
  return getCandidates()
    .filter(c => c.referredBy === captainId && !c.archived && extras[c.id]?.followUpDate)
    .map(c => {
      const d = new Date(extras[c.id].followUpDate!); d.setHours(0, 0, 0, 0);
      return { ...c, extra: extras[c.id], overdue: d < today, dueToday: d.getTime() === today.getTime(), _d: d };
    })
    .filter(c => (c as any)._d <= today)
    .map(({ _d: _, dueToday: __, ...rest }) => rest) as Array<Candidate & { extra: LeadExtra; overdue: boolean }>;
}

export function checkFollowUpReminders(captainId: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toDateString();
  const due = getFollowUpsDue(captainId);
  const existing = getNotifications();

  due.forEach(c => {
    const alreadyToday = existing.some(n =>
      n.type === 'followup' && n.candidateId === c.id &&
      new Date(n.createdAt).toDateString() === todayStr,
    );
    if (alreadyToday) return;
    addNotification({
      type: 'followup',
      title: c.overdue ? `⏰ Overdue: Call ${c.name}` : `📞 Follow up today: ${c.name}`,
      body: `${c.currentStage} stage · ${c.jobType} · ${c.location}`,
      candidateId: c.id,
      forRole: 'captain',
      read: false,
    });
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(c.overdue ? '⏰ Overdue follow-up' : '📞 Follow up today', {
        body: `${c.name} — ${c.currentStage} · ${c.jobType}`,
        icon: '/switch-icon.svg',
        tag: `followup-${c.id}-${todayStr}`,
      });
    }
  });
  return due.length;
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ─── ANALYTICS ────────────────────────────────────────────────
export function getCaptainStats(captainId: string) {
  const candidates = getCandidates().filter(c => c.referredBy === captainId && !c.archived);
  const now = new Date();
  const som = new Date(now.getFullYear(), now.getMonth(), 1);
  const allPlaced  = candidates.filter(c => c.currentStage === 'Placed');
  const thisMonth  = allPlaced.filter(c => c.placedAt && new Date(c.placedAt) >= som);

  const totalEarned  = allPlaced.filter(c => c.payout.status === 'paid').reduce((s, c) => s + c.payout.amount, 0);
  const pendingPayout= allPlaced.filter(c => ['pending','confirmed'].includes(c.payout.status)).reduce((s, c) => s + c.payout.amount, 0);
  const monthEarned  = thisMonth.filter(c => c.payout.status === 'paid').reduce((s, c) => s + c.payout.amount, 0);
  const monthPending = thisMonth.filter(c => ['pending','confirmed'].includes(c.payout.status)).reduce((s, c) => s + c.payout.amount, 0);

  const alertCount = allPlaced.filter(c =>
    c.guaranteeExpiresAt &&
    new Date(c.guaranteeExpiresAt).getTime() - Date.now() < 7 * 86400000 &&
    new Date(c.guaranteeExpiresAt).getTime() > Date.now()
  ).length;

  const tier = getTierLabel(allPlaced.length);
  const nextRate = getEarningRateForPlacementNumber(allPlaced.length + 1);

  // SLA alerts — candidates in non-placed stage > slaAlertDays
  const { slaAlertDays } = getSettings();
  const slaCandidates = candidates.filter(c => {
    if (c.currentStage === 'Placed') return false;
    const last = c.timeline[c.timeline.length - 1];
    const daysInStage = (Date.now() - new Date(last?.movedAt || c.submittedAt).getTime()) / 86400000;
    return daysInStage > slaAlertDays;
  });

  // Monthly funnel for this captain
  const monthlyFunnel = STAGE_ORDER.map(stage => ({
    stage,
    count: candidates.filter(c =>
      STAGE_ORDER.indexOf(c.currentStage) >= STAGE_ORDER.indexOf(stage) &&
      new Date(c.submittedAt) >= som
    ).length,
  }));

  return {
    totalLeads:          candidates.length,
    activePipeline:      candidates.filter(c => c.currentStage !== 'Placed').length,
    placements:          allPlaced.length,
    thisMonthPlacements: thisMonth.length,
    totalEarned, pendingPayout, monthEarned, monthPending,
    alertCount, tier, nextRate, slaCandidates,
    monthlyFunnel,
  };
}

export function getLeaderboard() {
  const captains = getCaptains();
  const candidates = getCandidates();
  const now = new Date();
  const som = new Date(now.getFullYear(), now.getMonth(), 1);
  return captains.map(captain => {
    const placed     = candidates.filter(c => c.referredBy === captain.id && c.currentStage === 'Placed');
    const thisMonth  = placed.filter(c => c.placedAt && new Date(c.placedAt) >= som);
    const earned     = placed.filter(c => c.payout.status === 'paid').reduce((s, c) => s + c.payout.amount, 0);
    const tier       = getTierLabel(placed.length);
    return { captain, placed: placed.length, thisMonth: thisMonth.length, earned, tier };
  }).sort((a, b) => b.thisMonth - a.thisMonth);
}

export function getGuaranteeAlerts(): (Candidate & { daysLeft: number; captainName: string })[] {
  const candidates = getCandidates();
  const captainMap: Record<string, string> = {};
  getCaptains().forEach(c => { captainMap[c.id] = c.name; });
  const now = Date.now();
  return candidates
    .filter(c => c.currentStage === 'Placed' && c.guaranteeExpiresAt && !c.archived)
    .map(c => ({
      ...c,
      daysLeft: Math.ceil((new Date(c.guaranteeExpiresAt!).getTime() - now) / 86400000),
      captainName: captainMap[c.referredBy] || c.referredBy,
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function getSLAViolations(): (Candidate & { daysInStage: number; captainName: string })[] {
  const settings = getSettings();
  const candidates = getCandidates();
  const captainMap: Record<string, string> = {};
  getCaptains().forEach(c => { captainMap[c.id] = c.name; });
  return candidates
    .filter(c => c.currentStage !== 'Placed' && !c.archived)
    .map(c => {
      const last = c.timeline[c.timeline.length - 1];
      const daysInStage = Math.floor((Date.now() - new Date(last?.movedAt || c.submittedAt).getTime()) / 86400000);
      return { ...c, daysInStage, captainName: captainMap[c.referredBy] || c.referredBy };
    })
    .filter(c => c.daysInStage > settings.slaAlertDays)
    .sort((a, b) => b.daysInStage - a.daysInStage);
}

export function getOpsAnalytics() {
  const candidates = getCandidates().filter(c => !c.archived);
  const now = new Date();
  const som = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth  = candidates.filter(c => new Date(c.submittedAt) >= som);
  const placed     = candidates.filter(c => c.currentStage === 'Placed');
  const revenue    = placed.reduce((s, c) => s + c.payout.amount, 0);
  const payoutsMade = placed.filter(c => c.payout.status === 'paid').reduce((s, c) => s + c.payout.amount, 0);

  const funnel = STAGE_ORDER.map(stage => ({
    stage,
    count: candidates.filter(c => STAGE_ORDER.indexOf(c.currentStage) >= STAGE_ORDER.indexOf(stage)).length,
  }));

  // Last 6 months placements
  const monthlyPlacements = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      count: placed.filter(c => c.placedAt && new Date(c.placedAt) >= mStart && new Date(c.placedAt) <= mEnd).length,
    };
  });

  return {
    totalPipeline:   thisMonth.length,
    placements:      placed.filter(c => c.placedAt && new Date(c.placedAt) >= som).length,
    convRate:        candidates.length > 0 ? Math.round((placed.length / candidates.length) * 100) : 0,
    revenue, payoutsMade,
    netRevenue:     revenue - payoutsMade,
    funnel, monthlyPlacements,
    slaViolations: getSLAViolations().length,
    guaranteeAlerts: getGuaranteeAlerts().filter(g => g.daysLeft < 7 && g.daysLeft >= 0).length,
  };
}

// ─── CAPTAIN ACHIEVEMENTS ─────────────────────────────────────
export function getCaptainAchievements(captainId: string): { id: string; label: string; icon: string; earned: boolean; desc: string }[] {
  const candidates = getCandidates().filter(c => c.referredBy === captainId && !c.archived);
  const placed = candidates.filter(c => c.currentStage === 'Placed').length;
  const total  = candidates.length;
  return [
    { id: 'first_lead',      icon: '🚀', label: 'First Lead',       earned: total >= 1,  desc: 'Submit your first candidate' },
    { id: 'first_placement', icon: '⭐', label: 'First Placement',  earned: placed >= 1,  desc: 'Get your first candidate placed' },
    { id: 'five_placements', icon: '🔥', label: 'On Fire',          earned: placed >= 5,  desc: '5 successful placements' },
    { id: 'silver_captain',  icon: '🥈', label: 'Silver Captain',   earned: placed >= 10, desc: '10 placements — Silver rank' },
    { id: 'gold_captain',    icon: '🥇', label: 'Gold Captain',     earned: placed >= 30, desc: '30 placements — ₹400/hire unlocked' },
    { id: 'platinum_captain',icon: '💎', label: 'Platinum Captain', earned: placed >= 60, desc: '60 placements — ₹500/hire unlocked' },
    { id: 'pipeline_master', icon: '🗂', label: 'Pipeline Master',  earned: total >= 50,  desc: 'Submit 50+ candidates' },
  ];
}

// ─── HELPERS ──────────────────────────────────────────────────
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatMobile(mobile: string): string {
  const c = mobile.replace(/\D/g, '');
  return c.length === 10 ? `${c.slice(0, 5)}-${c.slice(5)}` : mobile;
}
export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export const STAGE_ORDER: Stage[] = ['Sourced', 'Screening', 'Interviewed', 'Offered', 'Placed'];
export function getNextStage(stage: Stage): Stage | null {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

