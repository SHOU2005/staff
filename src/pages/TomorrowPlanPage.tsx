import { useEffect, useState } from "react";
import { Phone, MapPin, Briefcase, AlertTriangle, MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { format, addDays } from "date-fns";

interface Candidate {
  id: string;
  name: string;
  phone: string;
  role: string;
  location: string;
  status: string;
  joining_date: string | null;
  job_id?: string | null;
  notes: string | null;
}

interface PGDetails {
  id: string;
  name: string;
  owner_name: string;
  owner_phone: string;
  address_link: string;
}

interface JobDetails {
  id: string;
  title: string;
  salary: string | null;
  pg_id: string | null;
  pgs?: PGDetails | null;
}

type GroupedCandidates = Record<string, Record<string, Candidate[]>>;

const getWhatsAppText = (c: Candidate, job?: JobDetails) => {
  const dateStr = format(addDays(new Date(), 1), "d MMMM");
  const salaryStr = job?.salary ? job.salary : "₹12000-14000/month";
  const pgName = job?.pgs?.name || c.location || "AHPL, Green Park";
  const addressLink = job?.pgs?.address_link || "https://maps.app.goo.gl/Pge7h37MYyDRejYs7";
  const contactName = job?.pgs?.owner_name || "Gagan Aggarwal";
  const contactPhone = job?.pgs?.owner_phone || "+91 98115 63982";

  const msg = `Namaste ${c.name || ""} bhai 🙏

Aapki job confirm ho gayi — Switch ki taraf se badhai! 🎉

Role: ${c.role || "Helper"}
PG: ${pgName}
Address: ${addressLink}

Date: ${dateStr} | Time: 11:00 AM
Salary: ${salaryStr}

Kisse milna hai:
${contactName} ${contactPhone}
Bolna: "Main Switch se aaya hoon"

Saath laana hai:
✅ Aadhar Card (original + copy)
✅ 2 passport photos

Koi sawaal ho toh reply karo. All the best! 💪
— Switch | 9205617375 , 8368828660`;

  return encodeURIComponent(msg);
};

export default function TomorrowPlanPage() {
  const { user, profile } = useAuth();
  const [grouped, setGrouped] = useState<GroupedCandidates>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [jobsMap, setJobsMap] = useState<Record<string, JobDetails>>({});

  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const tomorrowDisplay = format(addDays(new Date(), 1), "EEEE, d MMMM");

  useEffect(() => {
    const fetchTomorrow = async () => {
      if (!user) return;
      let query = supabase
        .from("candidates")
        .select("*")
        .eq("joining_date", tomorrow);
      if (!profile?.is_admin) query = query.eq("added_by", user.id);
      
      const [{ data }, { data: jobData }] = await Promise.all([
        query,
        supabase.from("jobs").select("*, pgs(*)")
      ]);
      const candidates = (data || []) as Candidate[];
      const jobs = (jobData || []) as JobDetails[];
      
      const jobsMap = jobs.reduce((acc, job) => {
        acc[job.id] = job;
        return acc;
      }, {} as Record<string, JobDetails>);

      setJobsMap(jobsMap);
      setTotal(candidates.length);

      // Group by role → location
      const g: GroupedCandidates = {};
      candidates.forEach((c) => {
        if (!g[c.role]) g[c.role] = {};
        if (!g[c.role][c.location]) g[c.role][c.location] = [];
        g[c.role][c.location].push(c);
      });
      setGrouped(g);
      setLoading(false);
    };

    fetchTomorrow();

    const sub = supabase
      .channel("tomorrow-plan")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidates" },
        fetchTomorrow,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [user, profile]);

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Tomorrow's plan</p>
          <h1 className="page-title">Ready for tomorrow</h1>
          <p className="page-subtitle">
            Review the candidates who are joining tomorrow and send them a polished onboarding message instantly.
          </p>
        </div>
        <div className="page-actions">
          <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            <strong>{tomorrowDisplay}</strong>
            <div style={{ marginTop: 6 }}>{total} candidate{total !== 1 ? "s" : ""} scheduled to join</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <div className="spinner" />
        </div>
      ) : total === 0 ? (
        <div className="empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>
            No joinings tomorrow
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            Add candidates with tomorrow's date to see them here
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([role, locations]) => (
          <div key={role}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "rgba(30, 41, 59, 0.8)",
              borderRadius: 12,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--brand-teal)",
              border: "1px solid var(--border-color)"
            }}>
              <Briefcase size={16} />
              {role}
              <span style={{ marginLeft: "auto", opacity: 0.8, fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                {Object.values(locations).flat().length} people
              </span>
            </div>

            {Object.entries(locations).map(([location, people]) => (
              <div key={location} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    marginBottom: 6,
                    marginLeft: 4,
                  }}
                >
                  <MapPin size={12} />
                  {location}
                </div>

                {people.map((c) => {
                  const notConfirmed =
                    c.status !== "Confirmed" && c.status !== "Joined";
                  return (
                    <div
                      key={c.id}
                      className={`card ${notConfirmed ? "followup-highlight" : ""}`}
                      style={{ marginBottom: 8, padding: "12px 14px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>
                            {c.name}
                            {notConfirmed && (
                              <AlertTriangle
                                size={14}
                                color="var(--status-interested)"
                                style={{
                                  marginLeft: 6,
                                  verticalAlign: "middle",
                                }}
                              />
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--text-secondary)",
                              marginTop: 2,
                            }}
                          >
                            Status:{" "}
                            <span
                              style={{
                                color: notConfirmed
                                  ? "var(--status-interested)"
                                  : "var(--brand-green)",
                                fontWeight: 600,
                              }}
                            >
                              {c.status}
                            </span>
                          </div>
                          {c.notes && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                marginTop: 4,
                              }}
                            >
                              📝 {c.notes}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <a
                            href={`tel:${c.phone}`}
                            style={{
                              background: "rgba(37,211,102,0.1)",
                              borderRadius: "50%",
                              width: 36,
                              height: 36,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--brand-green)",
                            }}
                          >
                            <Phone size={16} />
                          </a>
                          <a
                            href={`https://wa.me/91${c.phone}?text=${getWhatsAppText(c, c.job_id ? jobsMap[c.job_id] : undefined)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: "linear-gradient(135deg, #25D366, #128C7E)",
                              borderRadius: "50%",
                              width: 36,
                              height: 36,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                            }}
                          >
                            <MessageCircle size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
