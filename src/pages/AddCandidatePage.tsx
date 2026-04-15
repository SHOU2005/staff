import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, ChevronLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { format, addDays } from "date-fns";

const ROLES = ["Kitchen Helper","Housekeeping","Security Guard","Warden","Picker Packer","Driver","Delivery Boy","Warehouse Staff","Field Sales","Office Assistant","Other"];
const LOCATIONS = ["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Other"];
const STATUSES = ["Interested","Not Interested","Confirmed","Joined","Pending"];

const STATUS_COLORS: Record<string, string> = {
  Joined: "var(--status-joined)",
  Interested: "var(--status-interested)",
  "Not Interested": "var(--status-not-interested)",
  Confirmed: "var(--status-confirmed)",
  Pending: "var(--status-pending)",
};

export default function AddCandidatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otherRole, setOtherRole] = useState("");
  const [otherLocation, setOtherLocation] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", role: "", location: "",
    status: "Interested", joining_date: "", follow_up_date: "",
    notes: "", job_id: "", doc_received: false,
  });
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("jobs").select("*, pgs(name)").eq("status", "Open").then(({ data }) => setJobs(data || []));
  }, []);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const handleQuickDate = (field: string, days: number) => set(field, format(addDays(new Date(), days), "yyyy-MM-dd"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = form.role === "Other" ? otherRole : form.role;
    const finalLocation = form.location === "Other" ? otherLocation : form.location;
    if (!form.name || !form.phone || !finalRole || !finalLocation) { toast.error("Fill all required fields"); return; }
    if (!/^\d{10}$/.test(form.phone)) { toast.error("Enter a valid 10-digit number"); return; }
    setLoading(true);
    const { data: existing } = await supabase.from("candidates").select("id").eq("phone", form.phone).single();
    if (existing) { toast.error("Candidate with this number already exists"); setLoading(false); return; }
    const { error } = await supabase.from("candidates").insert({
      ...form, role: finalRole, location: finalLocation,
      job_id: form.job_id || null, joining_date: form.joining_date || null,
      follow_up_date: form.follow_up_date || null, notes: form.notes || null,
      added_by: user!.id,
    });
    setLoading(false);
    if (error) toast.error("Failed: " + error.message);
    else { toast.success("Candidate added! 🎉"); navigate("/candidates"); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", flexShrink: 0 }}
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "var(--brand-green)", textTransform: "uppercase", letterSpacing: "0.1em" }}>New Entry</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em" }}>Add Candidate</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Name + Phone */}
        <div style={{ background: "var(--bg-card)", borderRadius: 18, padding: 16, marginBottom: 14, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Basic Info</div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder="Rahul Sharma" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone *</label>
            <input className="form-input" type="tel" inputMode="numeric" placeholder="9876543210" maxLength={10} value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
              {form.phone.length}/10 digits{form.phone.length === 10 ? " ✅" : ""}
            </div>
          </div>
        </div>

        {/* Role + Location */}
        <div style={{ background: "var(--bg-card)", borderRadius: 18, padding: 16, marginBottom: 14, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Position</div>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role *</label>
              <select className="form-select" value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="">Select role</option>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              {form.role === "Other" && (
                <input className="form-input" style={{ marginTop: 8 }} placeholder="Specify role *" value={otherRole} onChange={(e) => setOtherRole(e.target.value)} />
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Location *</label>
              <select className="form-select" value={form.location} onChange={(e) => set("location", e.target.value)}>
                <option value="">Select city</option>
                {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
              {form.location === "Other" && (
                <input className="form-input" style={{ marginTop: 8 }} placeholder="Specify city *" value={otherLocation} onChange={(e) => setOtherLocation(e.target.value)} />
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ background: "var(--bg-card)", borderRadius: 18, padding: 16, marginBottom: 14, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Status</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {STATUSES.map((s) => {
              const color = STATUS_COLORS[s];
              const selected = form.status === s;
              return (
                <button
                  key={s} type="button" onClick={() => set("status", s)}
                  style={{
                    padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", border: "1px solid", fontFamily: "inherit",
                    background: selected ? `${color}18` : "transparent",
                    borderColor: selected ? color : "rgba(255,255,255,0.08)",
                    color: selected ? color : "var(--text-muted)",
                    transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dates */}
        <div style={{ background: "var(--bg-card)", borderRadius: 18, padding: 16, marginBottom: 14, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Dates</div>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Joining
                <div style={{ display: "flex", gap: 4 }}>
                  {[["Today", 0], ["Tmw", 1]].map(([label, days]) => (
                    <button key={label as string} type="button" onClick={() => handleQuickDate("joining_date", days as number)}
                      style={{ border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-muted)", fontSize: 10, borderRadius: 6, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </label>
              <input type="date" className="form-input" value={form.joining_date} onChange={(e) => set("joining_date", e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Follow-up
                <div style={{ display: "flex", gap: 4 }}>
                  {[["Today", 0], ["Tmw", 1]].map(([label, days]) => (
                    <button key={label as string} type="button" onClick={() => handleQuickDate("follow_up_date", days as number)}
                      style={{ border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-muted)", fontSize: 10, borderRadius: 6, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </label>
              <input type="date" className="form-input" value={form.follow_up_date} onChange={(e) => set("follow_up_date", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Extra */}
        <div style={{ background: "var(--bg-card)", borderRadius: 18, padding: 16, marginBottom: 18, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Job & Docs</div>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Linked Job</label>
              <select className="form-select" value={form.job_id} onChange={(e) => set("job_id", e.target.value)}>
                <option value="">None</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} {j.pgs?.name ? `(${j.pgs.name})` : ""}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Documents</label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", background: "var(--bg-input)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                <input type="checkbox" checked={form.doc_received} onChange={(e) => setForm((f) => ({ ...f, doc_received: e.target.checked }))} style={{ width: 17, height: 17, accentColor: "var(--brand-green)" }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Received ✅</span>
              </label>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 14, marginBottom: 0 }}>
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" placeholder="Any additional info..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ fontSize: 15 }}>
          {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><UserPlus size={17} /> Add Candidate</>}
        </button>
      </form>
    </div>
  );
}
