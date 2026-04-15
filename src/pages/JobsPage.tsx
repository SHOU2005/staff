import { useEffect, useMemo, useState } from "react";
import {
  Plus, MapPin, DollarSign, User, Phone,
  Search, Pencil, X, Building2, Briefcase,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

interface PG {
  id: string;
  name: string;
  owner_name: string;
  owner_phone: string;
  address_link: string;
}

interface Job {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  pg_id: string | null;
  status: string;
  vacancies: number | null;
}

export default function JobsPage() {
  const { user } = useAuth();
  const [pgs, setPGs] = useState<PG[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPG, setExpandedPG] = useState<string | null>(null);

  const [showAddPG, setShowAddPG] = useState(false);
  const [pgForm, setPgForm] = useState({ name: "", owner_name: "", owner_phone: "", address_link: "" });
  const [editingPGId, setEditingPGId] = useState<string | null>(null);
  const [editingPgForm, setEditingPgForm] = useState({ name: "", owner_name: "", owner_phone: "", address_link: "" });

  const [showAddJobForPG, setShowAddJobForPG] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState({ title: "", salary: "", vacancies: 1 });
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editingJobForm, setEditingJobForm] = useState({ title: "", salary: "", vacancies: 1 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "Closed">("All");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [{ data: pData }, { data: jData }] = await Promise.all([
      supabase.from("pgs").select("*").order("created_at", { ascending: false }),
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
    ]);
    setPGs(pData || []);
    setJobs(jData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const s1 = supabase.channel("pgs-ch").on("postgres_changes", { event: "*", schema: "public", table: "pgs" }, fetchData).subscribe();
    const s2 = supabase.channel("jobs-ch").on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, fetchData).subscribe();
    return () => { supabase.removeChannel(s1); supabase.removeChannel(s2); };
  }, []);

  const handleAddPG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgForm.name.trim() || !pgForm.owner_name.trim() || !pgForm.owner_phone.trim()) {
      toast.error("Property name, owner name and phone are required");
      return;
    }
    if (!/^\d{10}$/.test(pgForm.owner_phone.replace(/\D/g, ""))) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("pgs").insert({
      name: pgForm.name.trim(),
      owner_name: pgForm.owner_name.trim(),
      owner_phone: pgForm.owner_phone.replace(/\D/g, ""),
      address_link: pgForm.address_link.trim() || "",
      added_by: user!.id,
    });
    setSaving(false);
    if (error) {
      console.error("PG insert error:", error);
      toast.error("Failed: " + (error.message || "Unknown error"));
    } else {
      toast.success("Property added! ✅");
      setPgForm({ name: "", owner_name: "", owner_phone: "", address_link: "" });
      setShowAddPG(false);
    }
  };

  const handleUpdatePG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPGId || !editingPgForm.name.trim() || !editingPgForm.owner_name.trim() || !editingPgForm.owner_phone.trim()) {
      toast.error("Fill all required fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("pgs").update({
      name: editingPgForm.name.trim(),
      owner_name: editingPgForm.owner_name.trim(),
      owner_phone: editingPgForm.owner_phone.replace(/\D/g, ""),
      address_link: editingPgForm.address_link.trim() || "",
    }).eq("id", editingPGId);
    setSaving(false);
    if (error) {
      console.error("PG update error:", error);
      toast.error("Failed: " + (error.message || "Unknown error"));
    } else {
      toast.success("Property updated!");
      setEditingPGId(null);
    }
  };

  const handleAddJob = async (e: React.FormEvent, pgId: string | null) => {
    e.preventDefault();
    if (!jobForm.title.trim()) { toast.error("Role title is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("jobs").insert({
      title: jobForm.title.trim(),
      salary: jobForm.salary.trim() || null,
      vacancies: jobForm.vacancies || 1,
      pg_id: pgId,
      added_by: user!.id,
    });
    setSaving(false);
    if (error) {
      console.error("Job insert error:", error);
      toast.error("Failed: " + (error.message || "Unknown error"));
    } else {
      toast.success("Job posted! ✅");
      setJobForm({ title: "", salary: "", vacancies: 1 });
      setShowAddJobForPG(null);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJobId || !editingJobForm.title.trim()) { toast.error("Role title required"); return; }
    setSaving(true);
    const { error } = await supabase.from("jobs").update({
      title: editingJobForm.title.trim(),
      salary: editingJobForm.salary.trim() || null,
      vacancies: editingJobForm.vacancies || 1,
    }).eq("id", editingJobId);
    setSaving(false);
    if (error) {
      console.error("Job update error:", error);
      toast.error("Failed: " + (error.message || "Unknown error"));
    } else {
      toast.success("Job updated!");
      setEditingJobId(null);
    }
  };

  const toggleStatus = async (job: Job) => {
    const newStatus = job.status === "Open" ? "Closed" : "Open";
    const { error } = await supabase.from("jobs").update({ status: newStatus }).eq("id", job.id);
    if (error) toast.error("Failed to update status");
  };

  const filteredJobs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return jobs.filter((job) => {
      const pg = pgs.find((p) => p.id === job.pg_id);
      const match = !q || job.title.toLowerCase().includes(q) || (job.salary?.toLowerCase().includes(q) ?? false) || (pg?.name.toLowerCase().includes(q) ?? false);
      return match && (statusFilter === "All" || job.status === statusFilter);
    });
  }, [jobs, pgs, searchQuery, statusFilter]);

  const jobsByPG = useMemo(() => {
    return filteredJobs.reduce((acc, job) => {
      const key = job.pg_id || "unassigned";
      if (!acc[key]) acc[key] = [];
      acc[key].push(job);
      return acc;
    }, {} as Record<string, Job[]>);
  }, [filteredJobs]);

  const stats = useMemo(() => ({
    pgCount: pgs.length,
    openJobs: jobs.filter((j) => j.status === "Open").length,
    closedJobs: jobs.filter((j) => j.status === "Closed").length,
  }), [jobs, pgs]);

  return (
    <div>
      {/* Header */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">Properties & Roles</p>
          <h1 className="page-title">Jobs</h1>
        </div>
        <button
          className="btn-primary"
          style={{ width: "auto", padding: "9px 14px", fontSize: 13 }}
          onClick={() => { setShowAddPG(!showAddPG); setEditingPGId(null); setShowAddJobForPG(null); }}
        >
          <Plus size={15} /> Add PG
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "PGs", value: stats.pgCount, color: "var(--brand-teal)" },
          { label: "Open", value: stats.openJobs, color: "var(--status-joined)" },
          { label: "Filled", value: stats.closedJobs, color: "var(--text-muted)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: "center", padding: "12px", borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          className="form-input"
          style={{ paddingLeft: 38, fontSize: 14 }}
          placeholder="Search PG, role or salary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="filter-chips" style={{ marginBottom: 14 }}>
        {(["All", "Open", "Closed"] as const).map((s) => (
          <button key={s} className={`chip ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
      </div>

      {/* Add PG Form */}
      {showAddPG && (
        <div className="card" style={{ border: "1px solid rgba(16,185,129,0.3)", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>New Property</div>
            <button onClick={() => setShowAddPG(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}><X size={16} /></button>
          </div>
          <form onSubmit={handleAddPG}>
            <div className="form-group">
              <label className="form-label">Property Name *</label>
              <input className="form-input" placeholder="e.g. AHPL Green Park" value={pgForm.name} onChange={(e) => setPgForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Owner Name *</label>
                <input className="form-input" placeholder="Gagan Aggarwal" value={pgForm.owner_name} onChange={(e) => setPgForm((f) => ({ ...f, owner_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Phone *</label>
                <input className="form-input" type="tel" placeholder="9811563982" value={pgForm.owner_phone} onChange={(e) => setPgForm((f) => ({ ...f, owner_phone: e.target.value }))} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Maps Link</label>
              <input className="form-input" placeholder="Google Maps URL" value={pgForm.address_link} onChange={(e) => setPgForm((f) => ({ ...f, address_link: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Plus size={14} /> Create Property</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 20 }} />)}
        </div>
      ) : (
        <>
          {pgs.map((pg) => {
            const pgJobs = jobsByPG[pg.id] || [];
            const openCount = pgJobs.filter((j) => j.status === "Open").length;
            const isExpanded = expandedPG === pg.id;

            return (
              <div key={pg.id} style={{ marginBottom: 12 }}>
                {/* PG Header Card */}
                <div
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-color)",
                    borderRadius: isExpanded ? "20px 20px 0 0" : 20,
                    padding: "14px 16px", cursor: "pointer",
                    borderBottom: isExpanded ? "1px solid rgba(255,255,255,0.04)" : undefined,
                  }}
                  onClick={() => setExpandedPG(isExpanded ? null : pg.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Icon */}
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(14,165,233,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Building2 size={18} color="var(--brand-teal)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pg.name}</div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                          <User size={11} /> {pg.owner_name}
                        </span>
                        <a href={`tel:${pg.owner_phone}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: 12, color: "var(--brand-green)", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                          <Phone size={11} /> {pg.owner_phone}
                        </a>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {openCount > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--status-joined)", background: "rgba(16,185,129,0.12)", padding: "2px 8px", borderRadius: 99 }}>
                          {openCount} open
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderTop: "none", borderRadius: "0 0 20px 20px", padding: "0 14px 14px" }}>
                    {/* Action Row */}
                    <div style={{ display: "flex", gap: 8, paddingTop: 12, marginBottom: 12 }}>
                      {pg.address_link && (
                        <a href={pg.address_link} target="_blank" rel="noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 10, background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", color: "var(--brand-teal)", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                          <MapPin size={13} /> Map
                        </a>
                      )}
                      <button
                        onClick={() => { setEditingPGId(editingPGId === pg.id ? null : pg.id); setEditingPgForm({ name: pg.name, owner_name: pg.owner_name, owner_phone: pg.owner_phone, address_link: pg.address_link }); }}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}
                      >
                        <Pencil size={12} /> Edit PG
                      </button>
                      <button
                        onClick={() => setShowAddJobForPG(showAddJobForPG === pg.id ? null : pg.id)}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "var(--brand-green)", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}
                      >
                        <Plus size={12} /> Add Job
                      </button>
                    </div>

                    {/* Edit PG Form */}
                    {editingPGId === pg.id && (
                      <form onSubmit={handleUpdatePG} style={{ marginBottom: 12, padding: 12, background: "rgba(139,92,246,0.06)", borderRadius: 12, border: "1px solid rgba(139,92,246,0.2)" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--brand-accent)" }}>Edit Property</div>
                        <div className="form-row">
                          <div className="form-group" style={{ marginBottom: 10 }}>
                            <label className="form-label">Name *</label>
                            <input className="form-input" value={editingPgForm.name} onChange={(e) => setEditingPgForm((f) => ({ ...f, name: e.target.value }))} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 10 }}>
                            <label className="form-label">Owner *</label>
                            <input className="form-input" value={editingPgForm.owner_name} onChange={(e) => setEditingPgForm((f) => ({ ...f, owner_name: e.target.value }))} />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group" style={{ marginBottom: 10 }}>
                            <label className="form-label">Phone *</label>
                            <input className="form-input" value={editingPgForm.owner_phone} onChange={(e) => setEditingPgForm((f) => ({ ...f, owner_phone: e.target.value }))} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 10 }}>
                            <label className="form-label">Maps Link</label>
                            <input className="form-input" value={editingPgForm.address_link} onChange={(e) => setEditingPgForm((f) => ({ ...f, address_link: e.target.value }))} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, padding: "10px" }}>Save</button>
                          <button type="button" className="btn-secondary" onClick={() => setEditingPGId(null)} style={{ padding: "10px 16px" }}>Cancel</button>
                        </div>
                      </form>
                    )}

                    {/* Add Job Form */}
                    {showAddJobForPG === pg.id && (
                      <form onSubmit={(e) => handleAddJob(e, pg.id)} style={{ marginBottom: 12, padding: 12, background: "rgba(16,185,129,0.05)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.15)" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--brand-green)" }}>Post New Role</div>
                        <div className="form-row">
                          <div className="form-group" style={{ marginBottom: 10 }}>
                            <label className="form-label">Role Title *</label>
                            <input className="form-input" placeholder="e.g. Helper" value={jobForm.title} onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 10 }}>
                            <label className="form-label">Salary</label>
                            <input className="form-input" placeholder="12k–14k" value={jobForm.salary} onChange={(e) => setJobForm((f) => ({ ...f, salary: e.target.value }))} />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label className="form-label">Total Vacancies</label>
                          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                            <button type="button" onClick={() => setJobForm((f) => ({ ...f, vacancies: Math.max(1, (f.vacancies || 1) - 1) }))} style={{ width: 40, height: 44, borderRadius: "10px 0 0 10px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "var(--text-primary)", fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>−</button>
                            <div style={{ flex: 1, height: 44, background: "var(--bg-input)", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "none", borderRight: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "var(--brand-green)" }}>{jobForm.vacancies || 1}</div>
                            <button type="button" onClick={() => setJobForm((f) => ({ ...f, vacancies: (f.vacancies || 1) + 1 }))} style={{ width: 40, height: 44, borderRadius: "0 10px 10px 0", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "var(--text-primary)", fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, padding: "10px" }}>
                            {saving ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : "Post Job"}
                          </button>
                          <button type="button" className="btn-secondary" onClick={() => setShowAddJobForPG(null)} style={{ padding: "10px 16px" }}>Cancel</button>
                        </div>
                      </form>
                    )}

                    {/* Jobs List */}
                    {pgJobs.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>
                        <Briefcase size={24} style={{ margin: "0 auto 8px", opacity: 0.3, display: "block" }} />
                        No jobs posted yet
                      </div>
                    ) : (
                      pgJobs.map((job) => (
                        <div key={job.id} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                          background: "rgba(255,255,255,0.02)", borderRadius: 12,
                          border: `1px solid ${job.status === "Open" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)"}`,
                          marginBottom: 8, opacity: job.status === "Closed" ? 0.65 : 1,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{job.title}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {job.salary && (
                                <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                                  <DollarSign size={10} /> {job.salary}
                                </div>
                              )}
                              {(job.vacancies ?? 0) > 0 && (
                                <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 3, color: job.status === "Open" ? "var(--brand-teal)" : "var(--text-muted)" }}>
                                  <Users size={10} /> {job.vacancies} {job.vacancies === 1 ? "vacancy" : "vacancies"}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            {editingJobId !== job.id ? (
                              <button
                                onClick={() => { setEditingJobId(job.id); setEditingJobForm({ title: job.title, salary: job.salary || "", vacancies: job.vacancies || 1 }); }}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, display: "flex" }}
                              >
                                <Pencil size={13} />
                              </button>
                            ) : (
                              <button onClick={() => setEditingJobId(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, display: "flex" }}>
                                <X size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => toggleStatus(job)}
                              style={{
                                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                                borderRadius: 99, fontSize: 11, fontWeight: 800, cursor: "pointer",
                                border: "none", fontFamily: "inherit",
                                background: job.status === "Open" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                                color: job.status === "Open" ? "var(--status-joined)" : "var(--text-muted)",
                              }}
                            >
                              {job.status === "Open" ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                              {job.status}
                            </button>
                          </div>
                          {/* Inline edit */}
                          {editingJobId === job.id && (
                            <form onSubmit={handleUpdateJob} style={{ width: "100%", marginTop: 10, gridColumn: "1/-1" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                <input className="form-input" style={{ fontSize: 13 }} value={editingJobForm.title} onChange={(e) => setEditingJobForm((f) => ({ ...f, title: e.target.value }))} placeholder="Role title" />
                                <input className="form-input" style={{ fontSize: 13 }} value={editingJobForm.salary} onChange={(e) => setEditingJobForm((f) => ({ ...f, salary: e.target.value }))} placeholder="Salary (e.g. 12k–14k)" />
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Vacancies</span>
                                <button type="button" onClick={() => setEditingJobForm((f) => ({ ...f, vacancies: Math.max(1, (f.vacancies || 1) - 1) }))} style={{ width: 32, height: 32, borderRadius: "8px 0 0 8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "var(--text-primary)", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>−</button>
                                <div style={{ width: 40, height: 32, background: "var(--bg-input)", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "none", borderRight: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "var(--brand-green)" }}>{editingJobForm.vacancies || 1}</div>
                                <button type="button" onClick={() => setEditingJobForm((f) => ({ ...f, vacancies: (f.vacancies || 1) + 1 }))} style={{ width: 32, height: 32, borderRadius: "0 8px 8px 0", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "var(--text-primary)", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
                              </div>
                              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: "10px", width: "100%" }}>Save Changes</button>
                            </form>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {pgs.length === 0 && !loading && (
            <div className="empty-state">
              <Building2 size={40} style={{ opacity: 0.2 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No properties yet</p>
              <p style={{ margin: "4px 0 0", fontSize: 13 }}>Tap "Add PG" above to create your first property</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
