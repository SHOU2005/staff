import { useEffect, useState } from "react";
import {
  Phone,
  Users,
  TrendingUp,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface PerfStats {
  totalCalls: number;
  totalPosts: number;
  totalCandidates: number;
  totalJoined: number;
  totalLeads: number;
  conversionRate: number;
  monthCalls: number;
  monthPosts: number;
  monthCandidates: number;
}

export default function PerformancePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PerfStats>({
    totalCalls: 0,
    totalPosts: 0,
    totalCandidates: 0,
    totalJoined: 0,
    totalLeads: 0,
    conversionRate: 0,
    monthCalls: 0,
    monthPosts: 0,
    monthCandidates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerf = async () => {
      if (!user) return;

      const now = new Date();
      const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const [allWork, monthWork, allCandidates, joinedCandidates] =
        await Promise.all([
          supabase
            .from("daily_work")
            .select("calls_done,posts_done,leads_added")
            .eq("staff_id", user.id),
          supabase
            .from("daily_work")
            .select("calls_done,posts_done")
            .eq("staff_id", user.id)
            .gte("date", firstOfMonth),
          supabase
            .from("candidates")
            .select("id", { count: "exact", head: true })
            .eq("added_by", user.id),
          supabase
            .from("candidates")
            .select("id", { count: "exact", head: true })
            .eq("added_by", user.id)
            .eq("status", "Joined"),
        ]);

      const sumArr = (arr: any[], key: string) =>
        (arr || []).reduce((a: number, r: any) => a + (r[key] || 0), 0);

      const totalCalls = sumArr(allWork.data || [], "calls_done");
      const totalPosts = sumArr(allWork.data || [], "posts_done");
      const totalLeads = sumArr(allWork.data || [], "leads_added");
      const totalCandidates = allCandidates.count ?? 0;
      const totalJoined = joinedCandidates.count ?? 0;
      const conversionRate =
        totalCandidates > 0
          ? Math.round((totalJoined / totalCandidates) * 100)
          : 0;

      setStats({
        totalCalls,
        totalPosts,
        totalLeads,
        totalCandidates,
        totalJoined,
        conversionRate,
        monthCalls: sumArr(monthWork.data || [], "calls_done"),
        monthPosts: sumArr(monthWork.data || [], "posts_done"),
        monthCandidates: 0,
      });
      setLoading(false);
    };
    fetchPerf();
  }, [user]);

  const allTimeMetrics = [
    {
      label: "Total Calls Made",
      value: stats.totalCalls,
      icon: Phone,
      color: "#25D366",
    },
    {
      label: "Total Posts Done",
      value: stats.totalPosts,
      icon: Briefcase,
      color: "#4FC3F7",
    },
    {
      label: "Total Candidates Added",
      value: stats.totalCandidates,
      icon: Users,
      color: "#7C4DFF",
    },
    {
      label: "Total Joined",
      value: stats.totalJoined,
      icon: CheckCircle,
      color: "#25D366",
    },
    {
      label: "Total Leads Found",
      value: stats.totalLeads,
      icon: TrendingUp,
      color: "#FF9800",
    },
  ];

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h1 className="page-title">My performance dashboard</h1>
          <p className="page-subtitle">
            See your conversion momentum, monthly progress, and long-term hiring impact in one premium space.
          </p>
        </div>
        <div className="page-actions">
          <div style={{ textAlign: "right", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{stats.totalCandidates.toLocaleString()} candidates</div>
            <div style={{ marginTop: 6, fontSize: 13 }}>Joined: {stats.totalJoined.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* Conversion Rate Hero */}
          <div
            style={{
              background:
                "linear-gradient(135deg, var(--brand-teal) 0%, #0a4f44 100%)",
              borderRadius: 16,
              padding: "24px 20px",
              marginBottom: 20,
              textAlign: "center",
              border: "1px solid rgba(37,211,102,0.2)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 8,
              }}
            >
              Conversion Rate
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {stats.conversionRate}%
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                marginTop: 8,
              }}
            >
              {stats.totalJoined} joined out of {stats.totalCandidates}{" "}
              candidates
            </div>
            <div className="progress-bar-bg" style={{ marginTop: 16 }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${stats.conversionRate}%` }}
              />
            </div>
          </div>

          {/* This month */}
          <p className="section-header">This Month</p>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="value">{stats.monthCalls}</div>
              <div className="label">📞 Calls</div>
            </div>
            <div className="stat-card">
              <div className="value">{stats.monthPosts}</div>
              <div className="label">📣 Posts</div>
            </div>
          </div>

          {/* All time */}
          <p className="section-header">All Time</p>
          <div className="card" style={{ padding: "8px 16px" }}>
            {allTimeMetrics.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="perf-metric">
                <div className="metric-label">
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${color}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={16} color={color} />
                  </div>
                  {label}
                </div>
                <div className="metric-value">{value.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Performance rating */}
          <div
            className="card"
            style={{ marginTop: 4, textAlign: "center", padding: "20px 16px" }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              {stats.conversionRate >= 30
                ? "🏆"
                : stats.conversionRate >= 15
                  ? "⭐"
                  : "💪"}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {stats.conversionRate >= 30
                ? "Excellent Performer!"
                : stats.conversionRate >= 15
                  ? "Good Work!"
                  : "Keep Going!"}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                marginTop: 4,
              }}
            >
              {stats.conversionRate >= 30
                ? "Top-tier conversion rate. Keep it up!"
                : stats.conversionRate >= 15
                  ? "Solid performance. Push for more joins!"
                  : "Every call is progress. Stay consistent!"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
