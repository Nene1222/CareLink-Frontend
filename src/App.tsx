import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Home from './pages/dashboard';
import AttendancePage from './features/attendance/attendance';
import POS from './pages/pos/POS';
import { AppointmentsPage } from './features/appointment/appointment'; 

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
