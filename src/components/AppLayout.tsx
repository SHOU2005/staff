import { type ReactNode, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  ClipboardCheck,
  Briefcase,
  IndianRupee,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/candidates", icon: Users, label: "People" },
  { to: "/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/payments", icon: IndianRupee, label: "Pay" },
  { to: "/daily-work", icon: ClipboardCheck, label: "Daily" },
  { to: "/tomorrow", icon: CalendarClock, label: "Plan" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingPayments, setPendingPayments] = useState(0);
  const [followUpsToday, setFollowUpsToday] = useState(0);

  const currentPage = useMemo(() => {
    if (location.pathname === "/") return "Dashboard";
    if (location.pathname === "/candidates") return "Candidates";
    if (location.pathname.startsWith("/candidates/")) return "Detail";
    if (location.pathname === "/add-candidate") return "Add";
    if (location.pathname === "/tomorrow") return "Tomorrow";
    if (location.pathname === "/jobs") return "Jobs";
    if (location.pathname === "/daily-work") return "Daily";
    if (location.pathname === "/performance") return "Stats";
    if (location.pathname === "/payments") return "Payments";
    return "Overview";
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const fetchBadges = async () => {
      const [pp, fu] = await Promise.all([
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("staff_id", user.id).eq("status", "Pending"),
        supabase.from("candidates").select("id", { count: "exact", head: true }).eq("added_by", user.id).eq("follow_up_date", today),
      ]);
      setPendingPayments(pp.count || 0);
      setFollowUpsToday(fu.count || 0);
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getBadge = (to: string) => {
    if (to === "/payments" && pendingPayments > 0) return pendingPayments;
    if (to === "/candidates" && followUpsToday > 0) return followUpsToday;
    return null;
  };

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-brand">
          <div className="brand-mark">S</div>
          <div>
            <div className="top-bar-title">Switch Staff</div>
            <div className="top-bar-subtitle">{currentPage}</div>
          </div>
        </div>
        <div className="top-bar-actions">
          {profile?.name && (
            <div className="user-chip">{profile.name.split(" ")[0]}</div>
          )}
          <button
            onClick={handleSignOut}
            className="icon-button"
            title="Logout"
            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.15)", color: "#f43f5e" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="page-content page-enter">{children}</div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.map(({ to, icon: Icon, label }) => {
          const badge = getBadge(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
            >
              {({ isActive }) => (
                <>
                  <div style={{ position: "relative" }}>
                    <Icon size={21} />
                    {badge ? (
                      <span className="nav-badge">{badge > 9 ? "9+" : badge}</span>
                    ) : null}
                  </div>
                  <span>{label}</span>
                  {isActive && <span className="nav-active-dot" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
