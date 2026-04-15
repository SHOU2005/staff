import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Search, MessageCircle, Download } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { format, isToday, parseISO } from "date-fns";

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
  doc_received: boolean;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  Joined: "var(--status-joined)",
  Interested: "var(--status-interested)",
  "Not Interested": "var(--status-not-interested)",
  Confirmed: "var(--status-confirmed)",
  Pending: "var(--status-pending)",
};

export default function CandidatesPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const statusFilters = ["All", "Interested", "Confirmed", "Joined", "Pending", "Not Interested"];

  const fetchCandidates = async () => {
    if (!user) return;
    let query = supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });
    if (!profile?.is_admin) query = query.eq("added_by", user.id);
    const { data } = await query;
    setCandidates(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidates();
    const sub = supabase
      .channel("candidates-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, fetchCandidates)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [user, profile]);

  const filtered = candidates.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isFollowUpDue = (c: Candidate) =>
    c.follow_up_date && isToday(parseISO(c.follow_up_date));

  const handleExportCSV = () => {
    const headers = ["Name,Phone,Role,Location,Status,Joining Date,Follow Up Date,Docs,Notes"];
    const rows = filtered.map((c) =>
      `"${c.name}","${c.phone}","${c.role}","${c.location}","${c.status}","${c.joining_date || ""}","${c.follow_up_date || ""}","${c.doc_received ? "Yes" : "No"}","${(c.notes || "").replace(/"/g, '""')}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `candidates_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">Pipeline</p>
          <h1 className="page-title">Candidates</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" onClick={handleExportCSV} style={{ padding: "8px 12px", fontSize: 13 }}>
            <Download size={14} />
          </button>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "8px 16px", fontSize: 14 }}
            onClick={() => navigate("/add-candidate")}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          type="search"
          className="form-input"
          style={{ paddingLeft: 40 }}
          placeholder="Search name, phone, role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status Filter Chips */}
      <div className="filter-chips" style={{ marginBottom: 12 }}>
        {statusFilters.map((s) => (
          <button
            key={s}
            className={`chip ${filterStatus === s ? "active" : ""}`}
            onClick={() => setFilterStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Count */}
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
        {filtered.length} candidate{filtered.length !== 1 ? "s" : ""}{filterStatus !== "All" ? ` · ${filterStatus}` : ""}
      </p>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No candidates found</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            {search ? "Try different search" : "Add your first candidate"}
          </p>
        </div>
      ) : (
        filtered.map((c) => {
          const statusColor = STATUS_COLORS[c.status] || "var(--text-secondary)";
          return (
            <div
              key={c.id}
              className={`candidate-item ${isFollowUpDue(c) ? "followup-highlight" : ""}`}
              onClick={() => navigate(`/candidates/${c.id}`)}
            >
              <div className="candidate-avatar">{getInitials(c.name)}</div>
              <div className="candidate-info">
                <div className="candidate-name">{c.name}</div>
                <div className="candidate-meta">{c.role} · {c.location}</div>
                <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: `${statusColor}20`, color: statusColor,
                  }}>
                    {c.status}
                  </span>
                  {isFollowUpDue(c) && (
                    <span style={{ color: "var(--status-interested)", fontSize: 11, fontWeight: 600 }}>⚠ Today</span>
                  )}
                  {c.joining_date && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      📅 {format(parseISO(c.joining_date), "d MMM")}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <a
                  href={`tel:${c.phone}`}
                  style={{
                    background: "rgba(37,211,102,0.1)", borderRadius: "50%",
                    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--brand-green)",
                  }}
                >
                  <Phone size={15} />
                </a>
                <a
                  href={`https://wa.me/91${c.phone}?text=${encodeURIComponent(`Hi ${c.name}! 😊 We have an opportunity as *${c.role}* in ${c.location}. Interested? — Switch Staff`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "linear-gradient(135deg, #25D366, #128C7E)", borderRadius: "50%",
                    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <MessageCircle size={15} />
                </a>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
