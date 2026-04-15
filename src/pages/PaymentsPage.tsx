import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import {
  IndianRupee, Check, Clock, Share2, Edit2,
  ChevronDown, ChevronUp, QrCode, X, AlertCircle, Wallet,
} from "lucide-react";

interface Payment {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_phone: string;
  pg_name: string;
  pg_phone: string;
  amount: number;
  status: "Pending" | "Received";
  received_at: string | null;
  notes: string | null;
  joining_date: string | null;
  created_at: string;
}

export default function PaymentsPage() {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", notes: "", pg_name: "", pg_phone: "" });
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Received">("All");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPayments = async () => {
    if (!user) return;
    let query = supabase.from("payments").select("*").order("created_at", { ascending: false });
    if (!profile?.is_admin) query = query.eq("staff_id", user.id);
    const { data } = await query;
    setPayments((data as Payment[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
    const sub = supabase.channel("payments-page").on("postgres_changes", { event: "*", schema: "public", table: "payments" }, fetchPayments).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [user, profile]);

  useEffect(() => {
    const saved = localStorage.getItem("payment_qr");
    if (saved) setQrUrl(saved);
  }, []);

  const received = payments.filter((p) => p.status === "Received");
  const pending = payments.filter((p) => p.status === "Pending");
  const totalReceived = received.reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = pending.reduce((s, p) => s + (p.amount || 0), 0);

  const filtered = payments.filter((p) => filterStatus === "All" || p.status === filterStatus);

  const handleMarkReceived = async (p: Payment) => {
    setSaving(true);
    const { error } = await supabase.from("payments").update({ status: "Received", received_at: new Date().toISOString() }).eq("id", p.id);
    setSaving(false);
    if (error) toast.error("Failed to update");
    else toast.success("✅ Marked as received!");
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    const cleanPhone = (editForm.pg_phone || "").replace(/\D/g, "").replace(/^91/, "");
    const { error } = await supabase.from("payments").update({
      amount: parseFloat(editForm.amount) || 0,
      notes: editForm.notes,
      pg_name: editForm.pg_name,
      pg_phone: cleanPhone,
    }).eq("id", id);
    setSaving(false);
    if (error) toast.error("Failed to save");
    else { toast.success("Updated!"); setEditingId(null); }
  };

  const sharePaymentWhatsApp = (p: Payment) => {
    // Clean phone — remove spaces, dashes, +91 prefix
    const rawPhone = (p.pg_phone || "").replace(/\D/g, "").replace(/^91/, "");
    if (!rawPhone || rawPhone.length < 10) {
      toast.error("⚠️ No PG phone number. Tap Edit to add it first.", { duration: 4000 });
      setEditingId(p.id);
      setEditForm({ amount: String(p.amount || ""), notes: p.notes || "", pg_name: p.pg_name || "", pg_phone: p.pg_phone || "" });
      return;
    }
    const hasQR = !!qrUrl;
    const amountText = p.amount ? `₹${p.amount.toLocaleString("en-IN")}` : "the agreed amount";
    const msg = `Hi *${p.pg_name || "Sir/Madam"}* 👋\n\n*${p.candidate_name}* has been successfully placed with you${p.joining_date ? ` on ${format(parseISO(p.joining_date), "d MMM yyyy")}` : ""}.\n\nRequest you to kindly process the placement fee of *${amountText}* at your earliest convenience.\n\n${hasQR ? "📲 Scan the QR I'll send next to pay via UPI." : "🙏 Please transfer via UPI/bank at your earliest."}\n\n— Switch Staff Team`;
    window.open(`https://wa.me/91${rawPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setQrUrl(dataUrl);
      localStorage.setItem("payment_qr", dataUrl);
      toast.success("QR saved!");
    };
    reader.readAsDataURL(file);
  };

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <p className="eyebrow">Commission Tracker</p>
        <h1 style={{ margin: "3px 0 0", fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>Payments</h1>
      </div>

      {/* Summary banner */}
      <div style={{
        padding: "16px", borderRadius: 18, marginBottom: 14,
        background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(14,165,233,0.08))",
        border: "1px solid rgba(16,185,129,0.18)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: 16, top: 16, opacity: 0.06 }}>
          <Wallet size={60} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--brand-green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Total Received
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--text-primary)" }}>
          ₹{totalReceived.toLocaleString("en-IN")}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Pending</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--brand-orange)" }}>₹{fmt(totalPending)}</div>
          </div>
          <div style={{ width: 1, background: "var(--border-color)" }} />
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Payments</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-secondary)" }}>{payments.length} total</div>
          </div>
          <div style={{ width: 1, background: "var(--border-color)" }} />
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Success</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--status-joined)" }}>
              {payments.length ? Math.round((received.length / payments.length) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* QR Setup Strip */}
      <div
        onClick={() => setShowQR(true)}
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
          borderRadius: 14, marginBottom: 14, cursor: "pointer",
          background: qrUrl ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${qrUrl ? "rgba(16,185,129,0.2)" : "var(--border-color)"}`,
          transition: "all 0.2s",
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: qrUrl ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <QrCode size={16} color={qrUrl ? "var(--brand-green)" : "var(--text-muted)"} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: qrUrl ? "var(--brand-green)" : "var(--text-primary)" }}>
            {qrUrl ? "✅ QR Code Ready" : "Upload Payment QR Code"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {qrUrl ? "Tap to change · Share with PG owners" : "Add UPI QR to send with payment requests"}
          </div>
        </div>
        <Share2 size={14} color="var(--text-muted)" />
      </div>

      {/* QR Modal */}
      {showQR && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", width: "100%", maxWidth: 480, border: "1px solid var(--border-color)", animation: "slideUp 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ width: 40, height: 4, background: "var(--border-highlight)", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Payment QR</h3>
              <button onClick={() => setShowQR(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "var(--text-secondary)", cursor: "pointer", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>
            {qrUrl ? (
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <img src={qrUrl} alt="QR" style={{ width: "100%", maxWidth: 200, borderRadius: 16, border: "2px solid rgba(16,185,129,0.3)" }} />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "28px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 16, marginBottom: 16, border: "1px dashed var(--border-color)" }}>
                <QrCode size={44} color="var(--text-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>No QR uploaded</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQRUpload} style={{ display: "none" }} />
            <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
              <QrCode size={15} /> {qrUrl ? "Change QR" : "Upload QR Image"}
            </button>
            {qrUrl && (
              <button className="btn-secondary" style={{ marginTop: 10, width: "100%" }} onClick={() => { localStorage.removeItem("payment_qr"); setQrUrl(""); toast.success("QR removed"); }}>
                Remove QR
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="filter-chips" style={{ marginBottom: 12 }}>
        {(["All", "Pending", "Received"] as const).map((s) => (
          <button key={s} className={`chip ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>
            {s}{s === "Pending" && pending.length > 0 ? ` (${pending.length})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 78, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <IndianRupee size={36} style={{ opacity: 0.15 }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No payments {filterStatus !== "All" ? `(${filterStatus})` : "yet"}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>Set a candidate status to Joined to auto-create a payment</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((p) => {
            const isExpanded = expandedId === p.id;
            const isReceived = p.status === "Received";

            return (
              <div
                key={p.id}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${isReceived ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)"}`,
                  borderRadius: 18, overflow: "hidden",
                }}
              >
                {/* Row */}
                <div style={{ padding: "13px 14px", cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                      background: isReceived ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isReceived ? <Check size={18} color="var(--status-joined)" /> : <Clock size={18} color="var(--brand-orange)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.candidate_name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {p.pg_name}
                        {p.joining_date ? ` · ${format(parseISO(p.joining_date), "d MMM")}` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: isReceived ? "var(--status-joined)" : "var(--brand-orange)" }}>
                        ₹{p.amount ? p.amount.toLocaleString("en-IN") : "—"}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isReceived ? "var(--status-joined)" : "var(--brand-orange)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>
                        {p.status}
                      </div>
                    </div>
                    <div style={{ color: "var(--text-muted)", marginLeft: 4, flexShrink: 0 }}>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border-color)", padding: "13px 14px" }}>
                    {editingId === p.id ? (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Amount (₹)</label>
                            <input className="form-input" type="number" placeholder="2000" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">PG Name</label>
                            <input className="form-input" placeholder="Property name" value={editForm.pg_name} onChange={(e) => setEditForm((f) => ({ ...f, pg_name: e.target.value }))} />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 8 }}>
                          <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                            PG Phone
                            {!editForm.pg_phone && <span style={{ color: "var(--status-not-interested)", fontSize: 10 }}>⚠ Required for WhatsApp</span>}
                          </label>
                          <input className="form-input" type="tel" inputMode="numeric" placeholder="9XXXXXXXXX (10 digits)" value={editForm.pg_phone} onChange={(e) => setEditForm((f) => ({ ...f, pg_phone: e.target.value.replace(/[^\d+]/g, "") }))} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 10 }}>
                          <label className="form-label">Notes</label>
                          <input className="form-input" placeholder="Optional note" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn-primary" style={{ flex: 1 }} disabled={saving} onClick={() => handleSaveEdit(p.id)}>
                            {saving ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : "Save"}
                          </button>
                          <button className="btn-secondary" onClick={() => setEditingId(null)} style={{ padding: "12px 16px" }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {p.notes && (
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10, marginBottom: 12 }}>
                            "{p.notes}"
                          </div>
                        )}
                        {isReceived && p.received_at && (
                          <div style={{ fontSize: 12, color: "var(--status-joined)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                            <Check size={13} /> Received on {format(parseISO(p.received_at), "d MMM yyyy, h:mm a")}
                          </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: !isReceived ? "1fr 1fr" : "1fr 1fr", gap: 8 }}>
                          {!isReceived && (
                            <button
                              className="btn-primary"
                              style={{ background: "linear-gradient(135deg, #10b981, #059669)", fontSize: 13, padding: "11px" }}
                              onClick={() => handleMarkReceived(p)}
                              disabled={saving}
                            >
                              <Check size={14} /> Got It
                            </button>
                          )}
                          <button
                            className="btn-secondary"
                            style={{ fontSize: 13, padding: "11px", gridColumn: isReceived ? "1 / 2" : undefined }}
                            onClick={() => { setEditingId(p.id); setEditForm({ amount: String(p.amount || ""), notes: p.notes || "", pg_name: p.pg_name || "", pg_phone: p.pg_phone || "" }); }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                              fontSize: 13, padding: "11px", borderRadius: 12, cursor: "pointer",
                              background: "linear-gradient(135deg, rgba(37,211,102,0.2), rgba(18,140,126,0.2))",
                              border: "1px solid rgba(37,211,102,0.3)", color: "#25D366",
                              fontFamily: "inherit", fontWeight: 700,
                              gridColumn: isReceived ? "2 / 3" : undefined,
                            }}
                            onClick={() => sharePaymentWhatsApp(p)}
                          >
                            <Share2 size={13} /> WhatsApp
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help note */}
      {!loading && payments.length > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
          <AlertCircle size={13} color="var(--text-muted)" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Set a candidate to <strong>Joined</strong> to auto-create a payment record. Edit the amount and mark received once paid.
          </p>
        </div>
      )}
    </div>
  );
}
