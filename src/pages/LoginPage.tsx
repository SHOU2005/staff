import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { signIn, session } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("Enter phone number and password");
      return;
    }
    setLoading(true);
    const { error } = await signIn(phone, password);
    setLoading(false);
    if (error) {
      toast.error("Invalid credentials. Check your phone or password.");
    } else {
      toast.success("Welcome back!");
    }
  };

  return (
    <div className="login-page">
      <div className="login-logo">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M18 6C11.37 6 6 11.37 6 18s5.37 12 12 12 12-5.37 12-12S24.63 6 18 6zm-1 17v-6h-2v-2h4v8h-2zm1-10a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
            fill="white"
          />
        </svg>
      </div>

      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
            Switch Staff
          </h1>
          <p style={{ margin: "10px auto 0", maxWidth: 360, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Internal hiring team portal with a polished recruiter dashboard experience.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div className="input-wrapper">
              <Phone size={16} className="input-prefix" />
              <input
                type="tel"
                className="form-input input-with-prefix"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper" style={{ position: "relative" }}>
              <Lock size={16} className="input-prefix" />
              <input
                type={showPassword ? "text" : "password"}
                className="form-input input-with-prefix"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 20, marginBottom: 0 }}>
          Contact your admin to get access
        </p>
      </div>
    </div>
  );
}
