import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Home from './pages/dashboard';
import AttendancePage from './features/attendance/attendance';
import POS from './pages/pos/POS';
import { AppointmentsPage } from './features/appointment/appointment'; 
import InventoryPage from './pages/inventory/page';
import MedicalRecord from './pages/medical/page';
import CompleteMedicalRecord from './pages/medical/completeMedicalRecord';

// Wrapper component to provide navigation prop to MedicalRecord
const MedicalRecordWithNav: React.FC = () => {
  const navigate = useNavigate();
  return <MedicalRecord onNavigateToForm={() => navigate('/medical-record/complete')} />;
};

// Wrapper to provide an onBack handler to CompleteMedicalRecord
const CompleteMedicalRecordWithNav: React.FC = () => {
  const navigate = useNavigate();
  return <CompleteMedicalRecord onBack={() => navigate(-1)} />;
};

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/appointment" element={<AppointmentsPage />} />
          <Route path="/profile" element={<Home />} />
          <Route path="/POS" element={<POS />} />
          <Route path="/inventory" element={<InventoryPage />} />
          {/* Wrapper to provide navigation prop to MedicalRecord */}
          <Route
            path="/medical-record"
            element={<MedicalRecordWithNav />}
          />
          <Route path="/medical-record/complete" element={<CompleteMedicalRecordWithNav />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
