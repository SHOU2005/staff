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
  seedDone:        'switch_seed_done',
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
  type:        'stage_change' | 'payout' | 'guarantee' | 'new_lead' | 'placement' | 'achievement' | 'sla_alert';
  title:       string;
  body:        string;
  createdAt:   string;
  read:        boolean;
  candidateId?: string;
  forRole?:    Role | 'all';
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
// ─── SUPABASE REALTIME SYNC (Candidates) ─────────────────────
function startRealtimeSync() {
  supabase.channel('public:candidates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, async () => {
      // Refresh candidates list automatically on change
      await importLegacyCandidatesFromSupabase(true);
      window.dispatchEvent(new Event('switch_data_update'));
    }).subscribe();
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
    userId: data.id, captainId: data.captainId, role: data.role,
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
  
  const { data: user, error } = await supabase.from('app_users').insert({
    phone: clean, password: encodePassword(password), name, role: 'captain', captainId, active: true
  }).select().single();

  if (error) return { ok: false, error: 'Database error creating user' };

  // Save captain profile locally (would also go to DB ideally)
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
    phone: clean, password: encodePassword(password), name, role: 'ops', captainId: 'ops_001', active: true
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
  
  // Realtime Supabase Push
  supabase.from('candidates').insert({
    name: newCand.name, phone: newCand.mobile, role: newCand.jobType,
    location: newCand.location, status: newCand.currentStage,
    added_by: newCand.referredBy, joining_date: newCand.placedAt,
    doc_received: newCand.archived,
    notes: JSON.stringify({ 
      id: newCand.id, payout: newCand.payout, timeline: newCand.timeline, 
      notes: newCand.notes, guaranteeExpiresAt: newCand.guaranteeExpiresAt,
      replacementNeeded: newCand.replacementNeeded, replacementForId: newCand.replacementForId,
      currentJob: newCand.currentJob, flagged: newCand.flagged 
    })
  }).then();

  return newCand;
}

export function updateCandidate(id: string, updates: Partial<Candidate>): Candidate | null {
  const candidates = getCandidates();
  const idx = candidates.findIndex(c => c.id === id);
  if (idx === -1) return null;
  candidates[idx] = { ...candidates[idx], ...updates };
  saveCandidates(candidates);
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
  return newJob;
}

export function updateJob(id: string, updates: Partial<Job>): Job | null {
  const jobs = getJobs();
  const idx = jobs.findIndex(j => j.id === id);
  if (idx === -1) return null;
  jobs[idx] = { ...jobs[idx], ...updates };
  saveJobs(jobs);
  return jobs[idx];
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

// ─── SEED DATA ────────────────────────────────────────────────
export function initSeedData() {
  if (localStorage.getItem(KEYS.seedDone)) return;

  const captains: Captain[] = [
    { id: 'captain_001', name: 'Priya Sharma',   mobile: '9812345678', upiId: 'priya@paytm',  joinedAt: '2024-11-01', active: true },
    { id: 'captain_002', name: 'Ravi Kumar',      mobile: '9823456789', upiId: 'ravi@upi',    joinedAt: '2024-11-15', active: true },
    { id: 'captain_003', name: 'Anjali Singh',    mobile: '9834567890', upiId: 'anjali@gpay',  joinedAt: '2024-12-01', active: true },
    { id: 'captain_004', name: 'Mohit Verma',     mobile: '9845678901', upiId: 'mohit@paytm',  joinedAt: '2025-01-05', active: true },
    { id: 'captain_005', name: 'Sunita Yadav',    mobile: '9856789012', upiId: 'sunita@upi',   joinedAt: '2025-01-10', active: true },
  ];



  const dAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

  const mkTl = (stage: Stage, days: number, capId: string): TimelineEntry[] => {
    const stages = STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(stage) + 1);
    return stages.map((s, i) => ({ stage: s, movedAt: dAgo(days - i * 2), movedBy: i === 0 ? capId : 'ops_001', note: '' }));
  };

  const placed: Candidate[] = [
    { id:'cand_p001', name:'Amit Kumar',    mobile:'9701111111', jobType:'Security Guard', location:'DLF Phase 2', currentStage:'Placed', referredBy:'captain_001', submittedAt:dAgo(40), placedAt:dAgo(5),  guaranteeExpiresAt:new Date(Date.now()+25*86400000).toISOString(), replacementNeeded:false, payout:{amount:300,status:'paid',    paidAt:dAgo(3)},  timeline:mkTl('Placed',40,'captain_001'), notes:[], flagged:false, archived:false },
    { id:'cand_p002', name:'Sunita Devi',   mobile:'9702222222', jobType:'Housekeeping',    location:'Sohna Road',  currentStage:'Placed', referredBy:'captain_001', submittedAt:dAgo(42), placedAt:dAgo(8),  guaranteeExpiresAt:new Date(Date.now()+22*86400000).toISOString(), replacementNeeded:false, payout:{amount:300,status:'confirmed', paidAt:null}, timeline:mkTl('Placed',42,'captain_001'), notes:[], flagged:false, archived:false },
    { id:'cand_p003', name:'Ramesh Singh',  mobile:'9703333333', jobType:'Driver',           location:'Cyber City',  currentStage:'Placed', referredBy:'captain_002', submittedAt:dAgo(35), placedAt:dAgo(26), guaranteeExpiresAt:new Date(Date.now()+4*86400000).toISOString(),  replacementNeeded:false, payout:{amount:300,status:'pending',  paidAt:null}, timeline:mkTl('Placed',35,'captain_002'), notes:[], flagged:false, archived:false },
    { id:'cand_p004', name:'Vikram Yadav',  mobile:'9704444444', jobType:'Cook',             location:'Udyog Vihar', currentStage:'Placed', referredBy:'captain_002', submittedAt:dAgo(50), placedAt:dAgo(31), guaranteeExpiresAt:new Date(Date.now()-1*86400000).toISOString(),  replacementNeeded:false, payout:{amount:300,status:'paid',    paidAt:dAgo(10)}, timeline:mkTl('Placed',50,'captain_002'), notes:[], flagged:false, archived:false },
  ];

  const offered: Candidate[] = [
    { id:'cand_o001', name:'Deepak Mishra', mobile:'9705555551', jobType:'Security Guard', location:'Golf Course Ext', currentStage:'Offered', referredBy:'captain_001', submittedAt:dAgo(20), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Offered',20,'captain_001'), notes:[], flagged:false, archived:false },
    { id:'cand_o002', name:'Kavita Rao',    mobile:'9705555552', jobType:'Housekeeping',   location:'DLF Phase 3',    currentStage:'Offered', referredBy:'captain_002', submittedAt:dAgo(18), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Offered',18,'captain_002'), notes:[], flagged:false, archived:false },
    { id:'cand_o003', name:'Suresh Patel',  mobile:'9705555553', jobType:'Cook',           location:'MG Road',        currentStage:'Offered', referredBy:'captain_003', submittedAt:dAgo(15), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Offered',15,'captain_003'), notes:[], flagged:false, archived:false },
    { id:'cand_o004', name:'Meena Kumari',  mobile:'9705555554', jobType:'Helper',         location:'Cyber City',     currentStage:'Offered', referredBy:'captain_004', submittedAt:dAgo(12), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Offered',12,'captain_004'), notes:[], flagged:false, archived:false },
    { id:'cand_o005', name:'Yogesh Sharma', mobile:'9705555555', jobType:'Driver',         location:'Manesar',        currentStage:'Offered', referredBy:'captain_005', submittedAt:dAgo(10), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Offered',10,'captain_005'), notes:[], flagged:false, archived:false },
  ];

  const interviewed: Candidate[] = [
    { id:'cand_i001', name:'Raju Gupta',    mobile:'9706661111', jobType:'Security Guard', location:'Sector 29',     currentStage:'Interviewed', referredBy:'captain_001', submittedAt:dAgo(14), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Interviewed',14,'captain_001'), notes:[], flagged:false, archived:false },
    { id:'cand_i002', name:'Pooja Nair',    mobile:'9706662222', jobType:'Housekeeping',   location:'DLF Phase 4',   currentStage:'Interviewed', referredBy:'captain_002', submittedAt:dAgo(12), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Interviewed',12,'captain_002'), notes:[], flagged:false, archived:false },
    { id:'cand_i003', name:'Arun Tiwari',   mobile:'9706663333', jobType:'Cook',           location:'Sector 45',     currentStage:'Interviewed', referredBy:'captain_003', submittedAt:dAgo(10), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Interviewed',10,'captain_003'), notes:[], flagged:false, archived:false },
    { id:'cand_i004', name:'Savita Devi',   mobile:'9706664444', jobType:'Helper',         location:'Udyog Vihar',   currentStage:'Interviewed', referredBy:'captain_004', submittedAt:dAgo(8),  placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Interviewed',8,'captain_004'),  notes:[], flagged:false, archived:false },
    { id:'cand_i005', name:'Dinesh Kumar',  mobile:'9706665555', jobType:'Driver',         location:'Golf Course Ext',currentStage:'Interviewed', referredBy:'captain_001', submittedAt:dAgo(7),  placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Interviewed',7,'captain_001'),  notes:[], flagged:false, archived:false },
    { id:'cand_i006', name:'Rekha Mishra',  mobile:'9706666666', jobType:'Housekeeping',   location:'Sohna Road',    currentStage:'Interviewed', referredBy:'captain_002', submittedAt:dAgo(6),  placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Interviewed',6,'captain_002'),  notes:[], flagged:false, archived:false },
  ];

  const screening: Candidate[] = [
    { id:'cand_s001', name:'Ganesh Yadav',  mobile:'9707771111', jobType:'Security Guard', location:'DLF Phase 1',  currentStage:'Screening', referredBy:'captain_001', submittedAt:dAgo(7), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Screening',7,'captain_001'), notes:[], flagged:false, archived:false },
    { id:'cand_s002', name:'Neha Verma',    mobile:'9707772222', jobType:'Housekeeping',   location:'Cyber City',   currentStage:'Screening', referredBy:'captain_003', submittedAt:dAgo(5), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Screening',5,'captain_003'), notes:[], flagged:false, archived:false },
    { id:'cand_s003', name:'Manoj Singh',   mobile:'9707773333', jobType:'Cook',           location:'MG Road',      currentStage:'Screening', referredBy:'captain_004', submittedAt:dAgo(4), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Screening',4,'captain_004'), notes:[], flagged:false, archived:false },
    { id:'cand_s004', name:'Seema Patel',   mobile:'9707774444', jobType:'Helper',         location:'Sector 56',    currentStage:'Screening', referredBy:'captain_005', submittedAt:dAgo(3), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Screening',3,'captain_005'), notes:[], flagged:false, archived:false },
    { id:'cand_s005', name:'Rajesh Thakur', mobile:'9707775555', jobType:'Driver',         location:'Udyog Vihar',  currentStage:'Screening', referredBy:'captain_002', submittedAt:dAgo(3), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Screening',3,'captain_002'), notes:[], flagged:false, archived:false },
    { id:'cand_s006', name:'Geeta Sharma',  mobile:'9707776666', jobType:'Security Guard', location:'DLF Phase 5',  currentStage:'Screening', referredBy:'captain_003', submittedAt:dAgo(2), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Screening',2,'captain_003'), notes:[], flagged:false, archived:false },
    { id:'cand_s007', name:'Harish Pandey', mobile:'9707777777', jobType:'Housekeeping',   location:'Manesar',      currentStage:'Screening', referredBy:'captain_001', submittedAt:dAgo(1), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:mkTl('Screening',1,'captain_001'), notes:[], flagged:false, archived:false },
  ];

  const sourced: Candidate[] = [
    { id:'cand_src001', name:'Pradeep Rawat', mobile:'9708881111', jobType:'Security Guard', location:'Sector 14',     currentStage:'Sourced', referredBy:'captain_001', submittedAt:dAgo(2),   placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:[{stage:'Sourced',movedAt:dAgo(2),  movedBy:'captain_001',note:''}], notes:[], flagged:false, archived:false },
    { id:'cand_src002', name:'Lalita Meena',  mobile:'9708882222', jobType:'Cook',           location:'DLF Phase 2',   currentStage:'Sourced', referredBy:'captain_002', submittedAt:dAgo(1),   placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:[{stage:'Sourced',movedAt:dAgo(1),  movedBy:'captain_002',note:''}], notes:[], flagged:false, archived:false },
    { id:'cand_src003', name:'Bharat Chauhan',mobile:'9708883333', jobType:'Helper',         location:'Sohna Road',    currentStage:'Sourced', referredBy:'captain_003', submittedAt:dAgo(1),   placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:[{stage:'Sourced',movedAt:dAgo(1),  movedBy:'captain_003',note:''}], notes:[], flagged:false, archived:false },
    { id:'cand_src004', name:'Anita Joshi',   mobile:'9708884444', jobType:'Housekeeping',   location:'Golf Course Ext',currentStage:'Sourced', referredBy:'captain_004', submittedAt:dAgo(0.5), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:[{stage:'Sourced',movedAt:dAgo(0.5),movedBy:'captain_004',note:''}], notes:[], flagged:false, archived:false },
    { id:'cand_src005', name:'Vivek Soni',    mobile:'9708885555', jobType:'Driver',         location:'Cyber City',    currentStage:'Sourced', referredBy:'captain_005', submittedAt:dAgo(0.3), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:[{stage:'Sourced',movedAt:dAgo(0.3),movedBy:'captain_005',note:''}], notes:[], flagged:false, archived:false },
    { id:'cand_src006', name:'Kiran Bala',    mobile:'9708886666', jobType:'Cook',           location:'Sector 29',     currentStage:'Sourced', referredBy:'captain_001', submittedAt:dAgo(0.2), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:[{stage:'Sourced',movedAt:dAgo(0.2),movedBy:'captain_001',note:''}], notes:[], flagged:false, archived:false },
    { id:'cand_src007', name:'Mohan Das',     mobile:'9708887777', jobType:'Helper',         location:'Manesar',       currentStage:'Sourced', referredBy:'captain_002', submittedAt:dAgo(0.1), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:[{stage:'Sourced',movedAt:dAgo(0.1),movedBy:'captain_002',note:''}], notes:[], flagged:false, archived:false },
    { id:'cand_src008', name:'Suman Rani',    mobile:'9708888888', jobType:'Security Guard', location:'DLF Phase 1',   currentStage:'Sourced', referredBy:'captain_003', submittedAt:new Date().toISOString(), placedAt:null, guaranteeExpiresAt:null, replacementNeeded:false, payout:{amount:300,status:'pending',paidAt:null}, timeline:[{stage:'Sourced',movedAt:new Date().toISOString(),movedBy:'captain_003',note:''}], notes:[], flagged:false, archived:false },
  ];

  if (getCandidates().length === 0) {
    saveCandidates([...placed, ...offered, ...interviewed, ...screening, ...sourced]);
  }

  const jobs: Job[] = [

    { id:'job_001', role:'Security Guard', location:'DLF Phase 2',  salaryRange:'₹12,000–₹15,000/mo', urgency:'high',   postedAt:dAgo(2), active:true, description:'Need 3 guards immediately for residential complex',  openings:3, filled:0 },
    { id:'job_002', role:'Housekeeping',   location:'Cyber City',    salaryRange:'₹10,000–₹13,000/mo', urgency:'medium', postedAt:dAgo(5), active:true, description:'Premium office housekeeping, 2 posts available',        openings:2, filled:0 },
    { id:'job_003', role:'Driver',         location:'Udyog Vihar',   salaryRange:'₹14,000–₹18,000/mo', urgency:'high',   postedAt:dAgo(1), active:true, description:'Corporate driver needed, Mon–Sat, company vehicle',      openings:1, filled:0 },
  ];

  const notifications: Notification[] = [
    { id:'n001', type:'stage_change', title:'Amit Kumar moved to Placed',          body:'Your candidate has been placed! ₹300 earned.', createdAt:dAgo(5),  read:false, candidateId:'cand_p001', forRole:'all' },
    { id:'n002', type:'payout',       title:'Payout of ₹300 confirmed',            body:'Payment for Amit Kumar via paytm',              createdAt:dAgo(3),  read:false, forRole:'captain' },
    { id:'n003', type:'guarantee',    title:'⚠️ Guarantee expiring in 4 days',     body:'Ramesh Singh — act fast!',                     createdAt:dAgo(1),  read:false, candidateId:'cand_p003', forRole:'ops' },
    { id:'n004', type:'new_lead',     title:'New lead submitted',                  body:'Raju Gupta added by Priya',                    createdAt:dAgo(14), read:true,  candidateId:'cand_i001', forRole:'ops' },
    { id:'n005', type:'placement',    title:'Sunita Devi placed!',                 body:'Sohna Road · Housekeeping · ₹300',             createdAt:dAgo(8),  read:true,  candidateId:'cand_p002', forRole:'all' },
    { id:'n006', type:'stage_change', title:'Deepak Mishra got an offer',          body:'Golf Course Ext · Security Guard',             createdAt:dAgo(2),  read:true,  candidateId:'cand_o001', forRole:'all' },
    { id:'n007', type:'sla_alert',    title:'🔴 SLA Alert: Ganesh Yadav',          body:'7+ days in Screening — action required',       createdAt:dAgo(1),  read:false, candidateId:'cand_s001', forRole:'ops' },
    { id:'n008', type:'achievement',  title:'🥉 Bronze Captain unlocked!',         body:'You made your first placement. Keep going!',   createdAt:dAgo(5),  read:true,  forRole:'captain' },
  ];

  saveCaptains(captains);
  saveCandidates([...placed, ...offered, ...interviewed, ...screening, ...sourced]);
  saveJobs(jobs);
  saveNotifications(notifications);
  localStorage.setItem(KEYS.seedDone, 'true');
}

// ─── MIGRATION: SHOURYA PANDEY ─────────────────────────────────
export function applyShouryaPandeyMigration() {
  if (localStorage.getItem('switch_migration_shourya_2')) return;
  
  const toRemoveNames = ['Priya Sharma', 'Ravi Kumar', 'Anjali Singh', 'Mohit Verma', 'Sunita Yadav'];
  let captains = getCaptains();
  const toRemoveIds = captains.filter(c => toRemoveNames.includes(c.name)).map(c => c.id);
  
  const shouryaId = 'captain_shourya_001';
  if (!captains.find(c => c.name.toLowerCase() === 'shourya pandey')) {
    captains.push({ id: shouryaId, name: 'Shourya Pandey', mobile: '9000000000', upiId: 'shourya@paytm', joinedAt: new Date().toISOString().split('T')[0], active: true });
  }
  
  captains = captains.filter(c => !toRemoveIds.includes(c.id));
  saveCaptains(captains);
  
  let candidates = getCandidates();
  // Remove candidates sourced by the deleted captains
  candidates = candidates.filter(cand => !toRemoveIds.includes(cand.referredBy));
  
  // Assign all remaining candidates to Shourya Pandey
  candidates = candidates.map(cand => ({ ...cand, referredBy: shouryaId }));
  saveCandidates(candidates);
  
  localStorage.setItem('switch_migration_shourya_2', 'true');
}

// ─── SUPABASE PULL ─────────────────────────────────────────────
export async function importLegacyCandidatesFromSupabase(force = false) {
  if (!force && localStorage.getItem('switch_legacy_imported')) {
    applyShouryaPandeyMigration();
    startRealtimeSync();
    return;
  }
  try {
    const { data: legacyCands, error } = await supabase.from('candidates').select('*');
    if (error || !legacyCands) return;
    
    // We replace the entire candidates state to ensure sync
    const imported: Candidate[] = legacyCands.map(sb => {
      let extra = {};
      try { extra = JSON.parse(sb.notes || '{}'); } catch (e) {}

      const stageMap: Record<string, Stage> = {
        'Joined': 'Placed',
        'Interview Scheduled': 'Interviewed',
        'Offer Pending': 'Offered',
      };
      const stage = stageMap[sb.status] || (sb.status as Stage) || 'Sourced';
      const isPlaced = stage === 'Placed';
      
      let gDate = null;
      if (isPlaced && sb.joining_date) {
        const d = new Date(sb.joining_date);
        d.setDate(d.getDate() + 30);
        gDate = d.toISOString();
      }

      return {
        id: (extra as any).id || `cand_legacy_${sb.id}`,
        name: sb.name || 'Unknown',
        mobile: sb.phone || '0000000000',
        jobType: sb.role || 'Other',
        location: sb.location || 'Other',
        currentStage: stage,
        referredBy: sb.added_by || 'ops_001',
        submittedAt: sb.created_at || new Date().toISOString(),
        placedAt: sb.joining_date || ((extra as any).placedAt) || null,
        guaranteeExpiresAt: (extra as any).guaranteeExpiresAt || gDate,
        replacementNeeded: (extra as any).replacementNeeded || false,
        replacementForId: (extra as any).replacementForId,
        currentJob: (extra as any).currentJob,
        payout: (extra as any).payout || { amount: 300, status: isPlaced ? 'paid' : 'pending', paidAt: isPlaced ? (sb.joining_date || sb.created_at) : null },
        timeline: (extra as any).timeline || [{ stage: stage, movedAt: sb.created_at || new Date().toISOString(), movedBy: 'ops_001', note: 'Imported' }],
        notes: (extra as any).notes || [],
        flagged: (extra as any).flagged || false,
        archived: sb.doc_received || false
      };
    });

    saveCandidates(imported);
    localStorage.setItem('switch_legacy_imported', 'true');
    applyShouryaPandeyMigration();
    if (!force) startRealtimeSync();
  } catch (err) {
    console.error('Import failed', err);
  }
}
