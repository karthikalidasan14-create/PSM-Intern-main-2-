import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./PublicLayout.jsx";
import AdminLayout from "./AdminLayout.jsx";
import Home from "./Home.jsx";
import InternProfile from "./InternProfile.jsx";
import InternIdCard from "./InternIdCard.jsx";
import ProjectOverview from "./ProjectOverview.jsx";
import MentorEvaluation from "./MentorEvaluation.jsx";
import VerifyCertificate from "./VerifyCertificate.jsx";
import CertificateDownload from "./CertificateDownload.jsx";
import ContactCompany from "./ContactCompany.jsx";
import AdminLogin from "./AdminLogin.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import InternManagement from "./InternManagement.jsx";
import ProjectManagement from "./ProjectManagement.jsx";
import EvaluationManagement from "./EvaluationManagement.jsx";
import CertificateManagement from "./CertificateManagement.jsx";
import AdminSettings from "./AdminSettings.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/intern/:internId" element={<InternProfile />} />
        <Route path="/intern/:internId/id-card" element={<InternIdCard />} />
        <Route path="/intern/:internId/project" element={<ProjectOverview />} />
        <Route path="/intern/:internId/evaluation" element={<MentorEvaluation />} />
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/verify.html" element={<VerifyCertificate />} />
        <Route path="/certificate" element={<CertificateDownload />} />
        <Route path="/certificate/:certificateId" element={<CertificateDownload />} />
        <Route path="/id-card" element={<Navigate to="/intern/PSMI012/id-card" replace />} />
        <Route path="/contact" element={<ContactCompany />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="interns" element={<InternManagement />} />
        <Route path="projects" element={<ProjectManagement />} />
        <Route path="evaluations" element={<EvaluationManagement />} />
        <Route path="certificates" element={<CertificateManagement />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
