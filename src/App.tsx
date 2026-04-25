import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { RoleProvider, useRole } from './contexts/RoleContext';

// Auth
import AuthPage from './pages/AuthPage';

// Layouts
import CaptainLayout from './components/CaptainLayout';
import OpsLayout     from './components/OpsLayout';

// Captain pages
import CaptainHomePage     from './pages/captain/HomePage';
import MyLeadsPage         from './pages/captain/MyLeadsPage';
import AddLeadPage         from './pages/captain/AddLeadPage';
import CandidateDetailPage from './pages/captain/CandidateDetailPage';
import CaptainEarningsPage from './pages/captain/EarningsPage';
import AlertsPage          from './pages/captain/AlertsPage';
import CaptainProfilePage  from './pages/captain/ProfilePage';
// Captain private talent pool
import CaptainTalentPoolPage  from './pages/captain/CommunityPage';
import CommunityBroadcastPage from './pages/captain/CommunityBroadcastPage';
import CommunityPollPage      from './pages/captain/CommunityPollPage';

// Social community
import FeedPage          from './pages/community/FeedPage';
import MembersPage       from './pages/community/MembersPage';
import ComposePage       from './pages/community/ComposePage';
import PostDetailPage    from './pages/community/PostDetailPage';
import MemberProfilePage from './pages/community/MemberProfilePage';
import JobBoardPage      from './pages/community/JobBoardPage';

// Ops pages
import OpsDashboardPage    from './pages/ops/DashboardPage';
import PipelinePage        from './pages/ops/PipelinePage';
import CaptainsPage        from './pages/ops/CaptainsPage';
import AnalyticsPage       from './pages/ops/AnalyticsPage';
import OpsSettingsPage     from './pages/ops/SettingsPage';
import GuaranteePage       from './pages/ops/GuaranteePage';
import OpsPayoutsPage      from './pages/ops/PayoutsPage';
import OpsJobsPage         from './pages/ops/JobsPage';
import OpsCommunityHubPage from './pages/ops/OpsCommunityHubPage';
import OpsOwnersPage       from './pages/ops/OwnersPage';
import OpsLocationsPage    from './pages/ops/LocationsPage';

// Worker-facing (no auth)
import WorkerStatusPage from './pages/WorkerStatusPage';

const toastStyle = {
  background:   '#fff',
  color:        'var(--neutral-900)',
  border:       '1px solid var(--neutral-200)',
  borderRadius: '14px',
  fontSize:     '14px',
  fontFamily:   "'Plus Jakarta Sans', sans-serif",
  fontWeight:   '600',
  maxWidth:     '340px',
  boxShadow:    '0 4px 20px rgba(0,0,0,0.1)',
};

const APP = import.meta.env.VITE_APP as 'captain' | 'ops' | undefined;
const showCaptain = !APP || APP === 'captain';
const showOps     = !APP || APP === 'ops';

function AppRoutes() {
  const { isLoggedIn, role } = useRole();

  return (
    <Routes>
      <Route path="/status/:mobile" element={<WorkerStatusPage />} />
      {!isLoggedIn && <Route path="*" element={<AuthPage />} />}

      {isLoggedIn && showCaptain && role === 'captain' && (
        <>
          <Route path="/"        element={<Navigate to="/captain/home" replace />} />
          <Route path="/captain" element={<Navigate to="/captain/home" replace />} />

          <Route path="/captain/home"      element={<CaptainLayout><CaptainHomePage /></CaptainLayout>} />
          <Route path="/captain/leads"      element={<CaptainLayout><MyLeadsPage /></CaptainLayout>} />
          <Route path="/captain/leads/new" element={<CaptainLayout><AddLeadPage /></CaptainLayout>} />
          <Route path="/captain/leads/:id" element={<CaptainLayout><CandidateDetailPage /></CaptainLayout>} />
          <Route path="/captain/earnings"  element={<CaptainLayout><CaptainEarningsPage /></CaptainLayout>} />
          <Route path="/captain/alerts"    element={<CaptainLayout><AlertsPage /></CaptainLayout>} />
          <Route path="/captain/profile"   element={<CaptainLayout><CaptainProfilePage /></CaptainLayout>} />

          {/* Social Community — Community nav tab lands here */}
          <Route path="/captain/community"                  element={<CaptainLayout><FeedPage /></CaptainLayout>} />
          <Route path="/captain/community/members"          element={<CaptainLayout><MembersPage /></CaptainLayout>} />
          <Route path="/captain/community/jobs"             element={<CaptainLayout><JobBoardPage /></CaptainLayout>} />
          <Route path="/captain/community/compose"          element={<CaptainLayout><ComposePage /></CaptainLayout>} />
          <Route path="/captain/community/post/:postId"     element={<CaptainLayout><PostDetailPage /></CaptainLayout>} />
          <Route path="/captain/community/member/:memberId" element={<CaptainLayout><MemberProfilePage /></CaptainLayout>} />

          {/* Private talent pool — accessible from Captain Profile */}
          <Route path="/captain/talent-pool"            element={<CaptainLayout><CaptainTalentPoolPage /></CaptainLayout>} />
          <Route path="/captain/talent-pool/broadcast"  element={<CaptainLayout><CommunityBroadcastPage /></CaptainLayout>} />
          <Route path="/captain/talent-pool/poll"       element={<CaptainLayout><CommunityPollPage /></CaptainLayout>} />

          <Route path="*" element={<Navigate to="/captain/home" replace />} />
        </>
      )}

      {isLoggedIn && showOps && role === 'ops' && (
        <>
          <Route path="/"    element={<Navigate to="/ops/dashboard" replace />} />
          <Route path="/ops" element={<Navigate to="/ops/dashboard" replace />} />
          <Route path="/ops/dashboard"  element={<OpsLayout><OpsDashboardPage /></OpsLayout>} />
          <Route path="/ops/pipeline"   element={<OpsLayout><PipelinePage /></OpsLayout>} />
          <Route path="/ops/captains"   element={<OpsLayout><CaptainsPage /></OpsLayout>} />
          <Route path="/ops/analytics"  element={<OpsLayout><AnalyticsPage /></OpsLayout>} />
          <Route path="/ops/guarantee"  element={<OpsLayout><GuaranteePage /></OpsLayout>} />
          <Route path="/ops/payouts"    element={<OpsLayout><OpsPayoutsPage /></OpsLayout>} />
          <Route path="/ops/jobs"       element={<OpsLayout><OpsJobsPage /></OpsLayout>} />
          <Route path="/ops/settings"   element={<OpsLayout><OpsSettingsPage /></OpsLayout>} />
          <Route path="/ops/community"  element={<OpsLayout><OpsCommunityHubPage /></OpsLayout>} />
          <Route path="/ops/owners"     element={<OpsLayout><OpsOwnersPage /></OpsLayout>} />
          <Route path="/ops/locations"  element={<OpsLayout><OpsLocationsPage /></OpsLayout>} />
          <Route path="*"               element={<Navigate to="/ops/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: toastStyle,
            success: { iconTheme: { primary: '#2EA86A', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </RoleProvider>
    </BrowserRouter>
  );
}
