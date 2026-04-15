import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Phone,
  Edit2,
  Save,
  X,
  Trash2,
  Share2,
  IndianRupee,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO, addDays } from "date-fns";
import toast from "react-hot-toast";

const ROLES = [
  "Kitchen Helper",
  "Housekeeping",
  "Security Guard",
  "Warden",
  "Picker Packer",
  "Driver",
  "Delivery Boy",
  "Warehouse Staff",
  "Field Sales",
  "Office Assistant",
  "Other",
];
const LOCATIONS = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Other",
];
const STATUSES = [
  "Interested",
  "Not Interested",
  "Confirmed",
  "Joined",
  "Pending",
];

const STATUS_COLORS: Record<string, string> = {
  Joined: "var(--status-joined)",
  Interested: "var(--status-interested)",
  "Not Interested": "var(--status-not-interested)",
  Confirmed: "var(--status-confirmed)",
  Pending: "var(--status-pending)",
};

interface Candidate {
  id: string;
  name: string;
  phone: string;
  role: string;
  location: string;
  status: string;
  joining_date: string | null;
  follow_up_date: string | null;
  notes: string | null;
  job_id: string | null;
  doc_received: boolean;
  added_by: string;
  created_at: string;
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Candidate>>({});
  const [otherRole, setOtherRole] = useState("");
  const [otherLocation, setOtherLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchCandidate = async () => {
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setCandidate(data);
        setForm({
          ...data,
          role: ROLES.includes(data.role) ? data.role : "Other",
          location: LOCATIONS.includes(data.location) ? data.location : "Other",
        });
        if (!ROLES.includes(data.role)) setOtherRole(data.role);
        if (!LOCATIONS.includes(data.location)) setOtherLocation(data.location);
      }
      const { data: jobData } = await supabase
        .from("jobs")
        .select("*, pgs(name)")
        .eq("status", "Open");
      setJobs(jobData || []);
      setLoading(false);
    };
    fetchCandidate();
  }, [id]);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleQuickDate = (field: string, days: number) => {
    set(field, format(addDays(new Date(), days), "yyyy-MM-dd"));
  };

  // Auto-create payment record when status → Joined
  const ensurePaymentRecord = async (candidateData: Candidate, linkedJob: any) => {
    // Check if payment already exists
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("candidate_id", candidateData.id)
      .single();
    if (existing) return;

    // Find PG info
    const pgId = linkedJob?.pg_id || null;
    let pgName = "Unknown PG";
    let pgPhone = "";
    if (pgId) {
      const { data: pgData } = await supabase.from("pgs").select("name, owner_phone").eq("id", pgId).single();
      if (pgData) {
        pgName = pgData.name;
        pgPhone = pgData.owner_phone;
      }
    }

    await supabase.from("payments").insert({
      candidate_id: candidateData.id,
      candidate_name: candidateData.name,
      candidate_phone: candidateData.phone,
      pg_name: pgName,
      pg_phone: pgPhone,
      amount: 2000,
      status: "Pending",
      joining_date: candidateData.joining_date,
      staff_id: user?.id,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const finalRole = form.role === "Other" ? otherRole : form.role;
    const finalLocation = form.location === "Other" ? otherLocation : form.location;
    const payload = {
      ...form,
      role: finalRole as string,
      location: finalLocation as string,
      job_id: form.job_id || null,
      doc_received: form.doc_received ?? false,
      joining_date: form.joining_date || null,
      follow_up_date: form.follow_up_date || null,
    };
    const { error } = await supabase
      .from("candidates")
      .update(payload)
      .eq("id", id!);
    setSaving(false);
    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success("Saved!");
      const updated = { ...candidate!, ...payload };
      setCandidate(updated);
      setEditing(false);

      // Auto-create payment if newly Joined
      if (payload.status === "Joined" && candidate?.status !== "Joined") {
        const linkedJob = jobs.find((j) => j.id === payload.job_id);
        await ensurePaymentRecord(updated, linkedJob);
        toast.success("💰 Payment record created!", { icon: "📋" });
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this candidate?")) return;
    const { error } = await supabase.from("candidates").delete().eq("id", id!);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    navigate("/candidates");
  };

  const shareOnWhatsApp = () => {
    if (!candidate) return;
    const msg = candidate.status === "Joined"
      ? `Hi! 👋 ${candidate.name} has been successfully placed as ${candidate.role}. Please process the payment at your earliest. Thank you! 🙏\n— Switch Staff`
      : `Hi ${candidate.name}! 😊 We have a great opportunity as *${candidate.role}* in ${candidate.location}. Are you interested? Please let us know! 🚀\n— Switch Staff`;
    window.open(`https://wa.me/91${candidate.phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <div className="spinner" />
      </div>
    );
  if (!candidate)
    return <div className="empty-state"><p>Candidate not found</p></div>;

  const statusColor = STATUS_COLORS[candidate.status] || "var(--text-secondary)";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", color: "var(--text-primary)", padding: 8, borderRadius: 10, display: "flex" }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, flex: 1, textAlign: "center" }}>
          {editing ? "Edit Candidate" : "Candidate"}
        </h1>
        <div style={{ display: "flex", gap: 6 }}>
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                style={{ background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 8, borderRadius: 10, display: "flex" }}
              >
                <X size={18} />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: "rgba(16,185,129,0.15)", border: "none", cursor: "pointer", color: "var(--brand-green)", padding: 8, borderRadius: 10, display: "flex" }}
              >
                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Save size={18} />}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                style={{ background: "rgba(244,63,94,0.1)", border: "none", cursor: "pointer", color: "var(--status-not-interested)", padding: 8, borderRadius: 10, display: "flex" }}
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setEditing(true)}
                style={{ background: "rgba(16,185,129,0.12)", border: "none", cursor: "pointer", color: "var(--brand-green)", padding: 8, borderRadius: 10, display: "flex" }}
              >
                <Edit2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {!editing ? (
        <>
          {/* Profile Card */}
          <div style={{ textAlign: "center", marginBottom: 20, padding: "20px 16px", background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border-color)" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--brand-teal), var(--brand-green))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 auto 10px",
            }}>
              {candidate.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{candidate.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>
              {candidate.role} · {candidate.location}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10,
              padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: `${statusColor}22`, color: statusColor,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
              {candidate.status}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <a
              href={`tel:${candidate.phone}`}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "12px 8px", borderRadius: 14, textDecoration: "none",
                background: "rgba(37,211,102,0.1)", color: "var(--brand-green)",
                border: "1px solid rgba(37,211,102,0.2)", fontSize: 12, fontWeight: 600,
              }}
            >
              <Phone size={18} /> Call
            </a>
            <a
              href={`https://wa.me/91${candidate.phone}?text=${encodeURIComponent(`Hi ${candidate.name}! 😊 We have an opportunity as *${candidate.role}* in ${candidate.location}. Are you interested? — Switch Staff`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "12px 8px", borderRadius: 14, textDecoration: "none",
                background: "linear-gradient(135deg, rgba(37,211,102,0.2), rgba(18,140,126,0.2))",
                color: "#25D366", border: "1px solid rgba(37,211,102,0.25)", fontSize: 12, fontWeight: 600,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2c-5.514 0-9.999 4.486-9.999 10 0 1.77.463 3.437 1.27 4.894L2 22l5.237-1.247A9.953 9.953 0 0 0 11.999 22C17.514 22 22 17.514 22 12S17.514 2 11.999 2zm0 18c-1.66 0-3.204-.49-4.5-1.329l-.314-.194-3.108.74.774-2.998-.208-.322A7.965 7.965 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.588 8-7.999 8h-.002z"/></svg>
              WhatsApp
            </a>
            <button
              onClick={shareOnWhatsApp}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "12px 8px", borderRadius: 14,
                background: candidate.status === "Joined" ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.04)",
                color: candidate.status === "Joined" ? "var(--brand-accent)" : "var(--text-secondary)",
                border: `1px solid ${candidate.status === "Joined" ? "rgba(139,92,246,0.25)" : "var(--border-color)"}`,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              {candidate.status === "Joined" ? <IndianRupee size={18} /> : <Share2 size={18} />}
              {candidate.status === "Joined" ? "Pay Msg" : "Share"}
            </button>
          </div>

          {/* Joined Payment Reminder */}
          {candidate.status === "Joined" && (
            <div
              onClick={() => navigate("/payments")}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                background: "rgba(16,185,129,0.08)", borderRadius: 14,
                border: "1px solid rgba(16,185,129,0.2)", marginBottom: 16, cursor: "pointer",
              }}
            >
              <IndianRupee size={18} color="var(--brand-green)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-green)" }}>Payment Tracking</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Tap to view & manage payment for this hire</div>
              </div>
              <ChevronLeft size={16} style={{ transform: "rotate(180deg)", color: "var(--text-muted)" }} />
            </div>
          )}

          {/* Details */}
          <div className="card" style={{ marginBottom: 0 }}>
            {[
              { label: "📱 Phone", value: candidate.phone },
              { label: "💼 Role", value: candidate.role },
              { label: "📍 Location", value: candidate.location },
              { label: "📄 Docs", value: candidate.doc_received ? "✅ Received" : "❌ Not yet" },
              {
                label: "📅 Joining",
                value: candidate.joining_date
                  ? format(parseISO(candidate.joining_date), "d MMM yyyy")
                  : "—",
              },
              {
                label: "🔔 Follow-up",
                value: candidate.follow_up_date
                  ? format(parseISO(candidate.follow_up_date), "d MMM yyyy")
                  : "—",
              },
              {
                label: "🕐 Added",
                value: format(parseISO(candidate.created_at), "d MMM yyyy"),
              },
            ].map(({ label, value }) => (
              <div key={label} className="perf-metric">
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {candidate.notes && (
            <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{candidate.notes}</div>
            </div>
          )}
        </>
      ) : (
        /* Edit form */
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" type="tel" value={form.phone || ""} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} maxLength={10} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role || ""} onChange={(e) => set("role", e.target.value)}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              {form.role === "Other" && (
                <input className="form-input" style={{ marginTop: 8 }} placeholder="Specify role" value={otherRole} onChange={(e) => setOtherRole(e.target.value)} />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <select className="form-select" value={form.location || ""} onChange={(e) => set("location", e.target.value)}>
                {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
              {form.location === "Other" && (
                <input className="form-input" style={{ marginTop: 8 }} placeholder="Specify location" value={otherLocation} onChange={(e) => setOtherLocation(e.target.value)} />
              )}
            </div>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  style={{
                    padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid",
                    background: form.status === s ? `${STATUS_COLORS[s]}22` : "var(--bg-card)",
                    borderColor: form.status === s ? STATUS_COLORS[s] : "var(--border-color)",
                    color: form.status === s ? STATUS_COLORS[s] : "var(--text-secondary)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Joining Date
                <div style={{ display: "flex", gap: 4 }}>
                  <button type="button" onClick={() => handleQuickDate("joining_date", 0)} style={{ border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-secondary)", fontSize: 10, borderRadius: 6, padding: "2px 6px", cursor: "pointer" }}>Today</button>
                  <button type="button" onClick={() => handleQuickDate("joining_date", 1)} style={{ border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-secondary)", fontSize: 10, borderRadius: 6, padding: "2px 6px", cursor: "pointer" }}>Tmw</button>
                </div>
              </label>
              <input type="date" className="form-input" value={form.joining_date || ""} onChange={(e) => set("joining_date", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Follow-up
                <div style={{ display: "flex", gap: 4 }}>
                  <button type="button" onClick={() => handleQuickDate("follow_up_date", 0)} style={{ border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-secondary)", fontSize: 10, borderRadius: 6, padding: "2px 6px", cursor: "pointer" }}>Today</button>
                  <button type="button" onClick={() => handleQuickDate("follow_up_date", 1)} style={{ border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-secondary)", fontSize: 10, borderRadius: 6, padding: "2px 6px", cursor: "pointer" }}>Tmw</button>
                </div>
              </label>
              <input type="date" className="form-input" value={form.follow_up_date || ""} onChange={(e) => set("follow_up_date", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Linked Job</label>
              <select className="form-select" value={form.job_id || ""} onChange={(e) => set("job_id", e.target.value)}>
                <option value="">None</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} {j.pgs?.name ? `(${j.pgs.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Documents</label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border-color)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.doc_received || false}
                  onChange={(e) => setForm((f) => ({ ...f, doc_received: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "var(--brand-green)" }}
                />
                <span style={{ fontSize: 14 }}>Received</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Save size={18} /> Save Changes</>}
          </button>
        </form>
      )}
    </div>
  );
}
