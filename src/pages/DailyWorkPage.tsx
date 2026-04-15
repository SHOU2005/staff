import { useEffect, useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function DailyWorkPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    calls_done: "",
    posts_done: "",
    leads_added: "",
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const todayDisplay = format(new Date(), "EEEE, d MMMM yyyy");

  const set = (field: string, value: string) => {
    const num = value.replace(/\D/g, "");
    setForm((f) => ({ ...f, [field]: num }));
    setSaved(false);
  };

  useEffect(() => {
    const fetchToday = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("daily_work")
        .select("*")
        .eq("staff_id", user.id)
        .eq("date", today)
        .single();
      if (data) {
        setExistingId(data.id);
        setForm({
          calls_done: String(data.calls_done),
          posts_done: String(data.posts_done),
          leads_added: String(data.leads_added),
        });
      }
      setLoading(false);
    };
    fetchToday();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      staff_id: user!.id,
      date: today,
      calls_done: parseInt(form.calls_done) || 0,
      posts_done: parseInt(form.posts_done) || 0,
      leads_added: parseInt(form.leads_added) || 0,
    };

    let error = null;
    if (existingId) {
      const res = await supabase
        .from("daily_work")
        .update(payload)
        .eq("id", existingId);
      error = res.error;
    } else {
      const res = await supabase
        .from("daily_work")
        .insert(payload)
        .select()
        .single();
      error = res.error;
      if (!error && res.data) setExistingId(res.data.id);
    }

    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Daily work saved!");
      setSaved(true);
    }
  };

  const fields = [
    {
      key: "calls_done",
      label: "Calls Done",
      emoji: "📞",
      placeholder: "0",
      hint: "Total calls made today",
    },
    {
      key: "posts_done",
      label: "Posts Done",
      emoji: "📣",
      placeholder: "0",
      hint: "Job posts shared today",
    },
    {
      key: "leads_added",
      label: "Leads Added",
      emoji: "✅",
      placeholder: "0",
      hint: "Prospects identified today",
    },
  ];

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Daily activity</p>
          <h1 className="page-title">Daily work log</h1>
          <p className="page-subtitle">
            Keep your daily performance accurate with a modern, polished logging experience.
          </p>
        </div>
        <div className="page-actions">
          <div style={{ textAlign: "right", color: "var(--text-secondary)" }}>
            <div>{todayDisplay}</div>
            <div style={{ marginTop: 6, fontSize: 13 }}>{existingId ? "Update today's entry" : "Start your first entry"}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {existingId && (
            <div
              style={{
                background: "rgba(37,211,102,0.1)",
                border: "1px solid rgba(37,211,102,0.3)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: 13,
                color: "var(--brand-green)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle size={16} />
              You've already logged work today. Saving will update it.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {fields.map((f) => (
              <div
                key={f.key}
                className="card"
                style={{ padding: "16px 20px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{f.emoji}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      {f.label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {f.hint}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                      fontSize: 20,
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      set(
                        f.key,
                        String(
                          Math.max(
                            0,
                            (parseInt(form[f.key as keyof typeof form]) || 0) -
                              1,
                          ),
                        ),
                      )
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="form-input"
                    style={{
                      textAlign: "center",
                      fontSize: 24,
                      fontWeight: 700,
                      padding: "10px",
                      flex: 1,
                    }}
                    value={form[f.key as keyof typeof form]}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                    inputMode="numeric"
                  />
                  <button
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "var(--brand-green)",
                      border: "none",
                      color: "#000",
                      fontSize: 20,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                    onClick={() =>
                      set(
                        f.key,
                        String(
                          (parseInt(form[f.key as keyof typeof form]) || 0) + 1,
                        ),
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: 24 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <div
                className="spinner"
                style={{ width: 18, height: 18, borderWidth: 2 }}
              />
            ) : saved ? (
              <>
                <CheckCircle size={18} /> Saved!
              </>
            ) : (
              <>
                <Save size={18} /> Save Today's Work
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
