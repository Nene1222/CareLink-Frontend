import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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

  // Navigate to the CompleteMedicalRecord route to create a new record
  const handleNavigateToForm = () => navigate('/medical-record/complete');

  // Navigate to the CompleteMedicalRecord route to edit an existing record.
  // We pass the full record via location.state so the form can populate.
  const handleEditRecord = (record: any) => {
    navigate('/medical-record/complete', { state: { editingRecord: record } });
  };

  return (
    <MedicalRecord
      onNavigateToForm={handleNavigateToForm}
      onEditRecord={handleEditRecord}
    />
  );
};

// Wrapper to provide an onBack handler to CompleteMedicalRecord and pass editing record
const CompleteMedicalRecordWithNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If navigation included an editingRecord in state, pass it down as prop
  const editingRecord = (location.state as any)?.editingRecord ?? null;

  return (
    <CompleteMedicalRecord
      onBack={() => navigate(-1)}
      editingRecord={editingRecord}
    />
  );
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
