import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import AdminOverview from './pages/AdminOverview'
import DecisionCenter from './pages/DecisionCenter'
import ScholarshipCriteria from './pages/ScholarshipCriteria'
import ProjectTimeline from './pages/ProjectTimeline'
import ComingSoon from './pages/ComingSoon'

import Suggestions from './pages/Suggestions'

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

          {/* Coming Soon pages */}
          <Route path="/applicant-database" element={<ComingSoon />} />
          <Route path="/fairness-audit" element={<ComingSoon />} />
          <Route path="/mlops" element={<ComingSoon />} />
          <Route path="/security" element={<ComingSoon />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
