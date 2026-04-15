import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, Users, Phone, Bell, Briefcase,
  IndianRupee, ClipboardCheck, TrendingUp, ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { format, addDays, isToday, parseISO } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  Joined: "var(--status-joined)",
  Interested: "var(--status-interested)",
  "Not Interested": "var(--status-not-interested)",
  Confirmed: "var(--status-confirmed)",
  Pending: "var(--status-pending)",
};

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ callsDone: 0, postsDone: 0, candidatesAdded: 0, tomorrowJoining: 0, followUpsDue: 0, pendingPayments: 0, totalJoined: 0 });
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const fetchStats = async () => {
    if (!user) return;
    const [workRes, todayRes, tomorrowRes, followUpRes, paymentsRes, joinedRes] = await Promise.all([
      supabase.from("daily_work").select("calls_done,posts_done").eq("staff_id", user.id).eq("date", today).single(),
      supabase.from("candidates").select("id", { count: "exact", head: true }).eq("added_by", user.id).gte("created_at", today + "T00:00:00").lte("created_at", today + "T23:59:59"),
      supabase.from("candidates").select("id", { count: "exact", head: true }).eq("added_by", user.id).eq("joining_date", tomorrow),
      supabase.from("candidates").select("id", { count: "exact", head: true }).eq("added_by", user.id).eq("follow_up_date", today),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("staff_id", user.id).eq("status", "Pending"),
      supabase.from("candidates").select("id", { count: "exact", head: true }).eq("added_by", user.id).eq("status", "Joined"),
    ]);

    setStats({
      callsDone: workRes.data?.calls_done ?? 0,
      postsDone: workRes.data?.posts_done ?? 0,
      candidatesAdded: todayRes.count ?? 0,
      tomorrowJoining: tomorrowRes.count ?? 0,
      followUpsDue: followUpRes.count ?? 0,
      pendingPayments: paymentsRes.count ?? 0,
      totalJoined: joinedRes.count ?? 0,
    });

    const recents = await supabase.from("candidates").select("id, name, role, status, phone, follow_up_date, location").eq("added_by", user.id).order("created_at", { ascending: false }).limit(5);
    setRecentCandidates(recents.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    const s1 = supabase.channel("dash-c").on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, fetchStats).subscribe();
    const s2 = supabase.channel("dash-w").on("postgres_changes", { event: "*", schema: "public", table: "daily_work" }, fetchStats).subscribe();
    return () => { supabase.removeChannel(s1); supabase.removeChannel(s2); };
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning ☀️";
    if (h < 17) return "Good afternoon 🌤️";
    return "Good evening 🌙";
  };

  const quickActions = [
    { label: "Add Candidate", icon: UserPlus, to: "/add-candidate", color: "#10b981", glow: "rgba(16,185,129," },
    { label: "Candidates", icon: Users, to: "/candidates", color: "#0ea5e9", glow: "rgba(14,165,233," },
    { label: "Jobs Board", icon: Briefcase, to: "/jobs", color: "#f59e0b", glow: "rgba(245,158,11," },
    { label: "Payments", icon: IndianRupee, to: "/payments", color: "#8b5cf6", glow: "rgba(139,92,246," },
  ];

  const statCards = [
    { label: "Calls Today", value: stats.callsDone, color: "#10b981", icon: "📞" },
    { label: "Added Today", value: stats.candidatesAdded, color: "#0ea5e9", icon: "➕" },
    { label: "Joining Tmw", value: stats.tomorrowJoining, color: stats.tomorrowJoining > 0 ? "#f59e0b" : "#10b981", icon: "📅" },
    { label: "Total Hired", value: stats.totalJoined, color: "#8b5cf6", icon: "🏆" },
  ];

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          {greeting()}
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-0.04em" }}>
          <span className="text-gradient">{profile?.name?.split(" ")[0] || "Welcome"}</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <div className="pulse-dot" />
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
            Live · {format(new Date(), "EEEE, d MMM")}
          </span>
        </div>
      </div>

      {/* Alert banners */}
      {stats.followUpsDue > 0 && (
        <div
          onClick={() => navigate("/candidates")}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            borderRadius: 14, marginBottom: 10, cursor: "pointer",
            background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bell size={15} color="var(--status-interested)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--status-interested)" }}>
              {stats.followUpsDue} follow-up{stats.followUpsDue > 1 ? "s" : ""} due today
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Tap to review candidates</div>
          </div>
          <ChevronRight size={14} color="var(--text-muted)" />
        </div>
      )}

      {stats.pendingPayments > 0 && (
        <div
          onClick={() => navigate("/payments")}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            borderRadius: 14, marginBottom: 14, cursor: "pointer",
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IndianRupee size={15} color="var(--brand-orange)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-orange)" }}>
              {stats.pendingPayments} payment{stats.pendingPayments > 1 ? "s" : ""} pending
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Collect commission from PGs</div>
          </div>
          <ChevronRight size={14} color="var(--text-muted)" />
        </div>
      )}

      {/* Stat Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 76, borderRadius: 16 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {statCards.map(({ label, value, color, icon }) => (
            <div
              key={label}
              style={{
                padding: "14px 14px", borderRadius: 16,
                background: `linear-gradient(135deg, ${color}14, ${color}06)`,
                border: `1px solid ${color}28`,
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: 10, right: 12, fontSize: 18, opacity: 0.3 }}>{icon}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginBottom: 8, fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Quick Actions</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 18 }}>
        {quickActions.map(({ label, icon: Icon, to, color, glow }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              background: `linear-gradient(145deg, ${glow}0.12), ${glow}0.04))`,
              border: `1px solid ${glow}0.25)`,
              borderRadius: 18, padding: "14px 10px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
              fontFamily: "inherit",
            }}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 13,
              background: `${glow}0.2)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color, boxShadow: `0 4px 16px ${glow}0.25)`,
            }}>
              <Icon size={20} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textAlign: "center" }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Daily Work Card */}
      <div
        onClick={() => navigate("/daily-work")}
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
          background: "var(--bg-card)", borderRadius: 18,
          border: "1px solid var(--border-color)", marginBottom: 18, cursor: "pointer",
          transition: "border-color 0.2s",
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ClipboardCheck size={18} color="var(--brand-green)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Daily Work Log</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {stats.callsDone > 0 ? `${stats.callsDone} calls · ${stats.postsDone} posts today` : "Tap to log activity"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {[...Array(Math.min(stats.callsDone, 5))].map((_, i) => (
            <div key={i} style={{ width: 4, height: 16 + (i * 3), borderRadius: 2, background: "var(--brand-green)", opacity: 0.6 + (i * 0.08) }} />
          ))}
          {stats.callsDone === 0 && <Phone size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Performance teaser */}
      <div
        onClick={() => navigate("/performance")}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 16,
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.04))",
          border: "1px solid rgba(139,92,246,0.2)", marginBottom: 18, cursor: "pointer",
        }}
      >
        <TrendingUp size={18} color="var(--brand-accent)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-accent)" }}>Performance Stats</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>View your hiring analytics</div>
        </div>
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>

      {/* Recent Candidates */}
      {!loading && recentCandidates.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Recent</div>
            <button
              onClick={() => navigate("/candidates")}
              style={{ fontSize: 12, color: "var(--brand-teal)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              See all →
            </button>
          </div>
          {recentCandidates.map((c) => {
            const statusColor = STATUS_COLORS[c.status] || "var(--text-secondary)";
            return (
              <div
                key={c.id}
                className={`candidate-item ${c.follow_up_date && isToday(parseISO(c.follow_up_date)) ? "followup-highlight" : ""}`}
                onClick={() => navigate(`/candidates/${c.id}`)}
              >
                <div className="candidate-avatar" style={{ width: 40, height: 40, fontSize: 13, borderRadius: 12 }}>
                  {c.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="candidate-info">
                  <div className="candidate-name" style={{ fontSize: 14 }}>{c.name}</div>
                  <div className="candidate-meta">{c.role} · {c.location}</div>
                </div>
                <span style={{ padding: "3px 8px", borderRadius: 99, fontSize: 10, fontWeight: 800, background: `${statusColor}18`, color: statusColor, flexShrink: 0 }}>
                  {c.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
