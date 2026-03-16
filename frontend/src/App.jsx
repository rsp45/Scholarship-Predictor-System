import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import AdminOverview from './pages/AdminOverview'
import DecisionCenter from './pages/DecisionCenter'
import ScholarshipCriteria from './pages/ScholarshipCriteria'
import ProjectTimeline from './pages/ProjectTimeline'
import ComingSoon from './pages/ComingSoon'

import Suggestions from './pages/Suggestions'
import FairnessAudit from './pages/FairnessAudit'
import MLOps from './pages/MLOps'
import SecurityAudit from './pages/SecurityAudit'
import ApplicantDatabase from './pages/ApplicantDatabase'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page — standalone (no sidebar) */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard — with sidebar layout */}
        <Route element={<Layout />}>
          <Route path="/admin-overview" element={<AdminOverview />} />
          <Route path="/decision-center" element={<DecisionCenter />} />
          <Route path="/policy-rules" element={<ScholarshipCriteria />} />
          <Route path="/timeline" element={<ProjectTimeline />} />
          <Route path="/suggestions" element={<Suggestions />} />

          {/* Newly Created Pages */}
          <Route path="/applicant-database" element={<ApplicantDatabase />} />
          <Route path="/fairness-audit" element={<FairnessAudit />} />
          <Route path="/mlops" element={<MLOps />} />
          <Route path="/security" element={<SecurityAudit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
