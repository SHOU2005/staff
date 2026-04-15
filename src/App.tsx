import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CandidatesPage from "./pages/CandidatesPage";
import AddCandidatePage from "./pages/AddCandidatePage";
import CandidateDetailPage from "./pages/CandidateDetailPage";
import TomorrowPlanPage from "./pages/TomorrowPlanPage";
import DailyWorkPage from "./pages/DailyWorkPage";
import PerformancePage from "./pages/PerformancePage";
import JobsPage from "./pages/JobsPage";
import PaymentsPage from "./pages/PaymentsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#2A3942",
              color: "#E9EDEF",
              border: "1px solid #374045",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              maxWidth: "340px",
            },
            success: {
              iconTheme: { primary: "#25D366", secondary: "#000" },
            },
            error: {
              iconTheme: { primary: "#FF5252", secondary: "#fff" },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/candidates/:id" element={<CandidateDetailPage />} />
            <Route path="/add-candidate" element={<AddCandidatePage />} />
            <Route path="/tomorrow" element={<TomorrowPlanPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/daily-work" element={<DailyWorkPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/payments" element={<PaymentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
