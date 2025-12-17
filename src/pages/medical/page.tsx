import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../assets/style/medical/medical.css";
import StatusBadge from '../../components/ui/status';
import ActionMenu from '../../components/medical/actionMenu';
import MedicalRecordDetails from '../../components/medical/medicalRecordDetails';
// TODO: Uncomment when backend API is integrated
// import { medicalRecordService, type MedicalRecord } from '../../services/api/medicalRecordService';
// import { generateMedicalRecordPDF } from '../../utils/pdfGenerator';

// Temporary type definition for frontend testing
type MedicalRecord = {
  _id?: string;
  id?: string;
  recordId: string;
  status: 'Completed' | 'Draft';
  patient: {
    name: string;
    id: string;
    age: number;
    gender: string;
    dateOfBirth: string;
    address?: string;
    contactNumber?: string;
  };
  visit: {
    dateOfVisit: string;
    doctor: string;
    reasonOfVisit?: string;
  };
  diagnosis?: {
    diagnosis?: string;
    testsOrdered?: string;
  };
};






// Legacy interface for backward compatibility
export interface MedicalRecordData {
  recordId: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: string;
  dateOfVisit: string;
  diagnosis: string;
  doctor: string;
  status: 'Completed' | 'Daft';
}

interface MedicalRecordProps {
  onNavigateToForm?: () => void;
  onEditRecord?: (record: MedicalRecordData) => void;
  onSetAddRecord?: (fn: (record: MedicalRecordData) => void) => void;
  onSetUpdateRecord?: (fn: (record: MedicalRecordData) => void) => void;
}

const MedicalRecord: React.FC<MedicalRecordProps> = ({ 
  onNavigateToForm, 
  onEditRecord,
  onSetAddRecord,
  onSetUpdateRecord
}) => {
  const navigate = useNavigate();
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  // Mock data for frontend testing
  const mockRecords: MedicalRecord[] = [
    {
      recordId: 'MR-001',
      status: 'Completed',
      patient: {
        name: 'John Doe',
        id: 'P001',
        age: 45,
        gender: 'Male',
        dateOfBirth: '1979-05-15',
        address: '123 Main St, Phnom Penh',
        contactNumber: '+855 123 456 789',
      },
      visit: {
        dateOfVisit: '2025-01-20',
        doctor: 'Dr. Sarah Johnson',
        reasonOfVisit: 'Regular checkup',
      },
      diagnosis: {
        diagnosis: 'Hypertension, well-controlled',
        testsOrdered: 'Blood pressure monitoring',
      },
    },
    {
      recordId: 'MR-002',
      status: 'Draft',
      patient: {
        name: 'Jane Smith',
        id: 'P002',
        age: 32,
        gender: 'Female',
        dateOfBirth: '1992-08-22',
        address: '456 Oak Ave, Phnom Penh',
        contactNumber: '+855 987 654 321',
      },
      visit: {
        dateOfVisit: '2025-01-21',
        doctor: 'Dr. Michael Chen',
        reasonOfVisit: 'Cough and fever',
      },
      diagnosis: {
        diagnosis: 'Upper respiratory infection',
      },
    },
  ];

  const [records, setRecords] = useState<MedicalRecord[]>(mockRecords);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load records from API
  useEffect(() => {
    loadRecords();
  }, [tableSearchTerm]);

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Uncomment when backend API is integrated
      // const data = await medicalRecordService.getAll(tableSearchTerm || undefined);
      
      // Mock data for frontend testing
      let filtered = [...mockRecords];
      if (tableSearchTerm) {
        const searchLower = tableSearchTerm.toLowerCase();
        filtered = mockRecords.filter(record =>
          record.recordId.toLowerCase().includes(searchLower) ||
          record.patient.name.toLowerCase().includes(searchLower) ||
          record.patient.id.toLowerCase().includes(searchLower) ||
          (record.diagnosis?.diagnosis || '').toLowerCase().includes(searchLower) ||
          record.visit.doctor.toLowerCase().includes(searchLower)
        );
      }
      setRecords(filtered);
    } catch (err: any) {
      console.error('Failed to load medical records:', err);
      setError(err.message || 'Failed to load medical records');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter records based on search (client-side filtering as backup)
  const filteredRecords = records.filter(record => {
    if (!tableSearchTerm) return true;
    const searchLower = tableSearchTerm.toLowerCase();
    return (
      record.recordId.toLowerCase().includes(searchLower) ||
      record.patient.name.toLowerCase().includes(searchLower) ||
      record.patient.id.toLowerCase().includes(searchLower) ||
      (record.diagnosis?.diagnosis || '').toLowerCase().includes(searchLower) ||
      record.visit.doctor.toLowerCase().includes(searchLower)
    );
  });

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    setMenuPosition({
      top: rect.bottom + 5,
      left: rect.left - 200, // Offset to show menu to the left of the button
    });
    setActiveMenu(index);
  };

  const handleCloseMenu = () => {
    setActiveMenu(null);
  };

  const handleViewDetails = async (index: number) => {
    const record = filteredRecords[index];
    try {
      // TODO: Uncomment when backend API is integrated
      // const fullRecord = await medicalRecordService.getById(record._id || record.id || '');
      
      // Mock data for frontend testing
      setSelectedRecord(record);
      setIsDetailsOpen(true);
      handleCloseMenu();
    } catch (err: any) {
      console.error('Failed to load record details:', err);
      alert('Failed to load record details');
      handleCloseMenu();
    }
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedRecord(null);
  };

  const handleEditRecord = async (index: number) => {
    const record = filteredRecords[index];
    try {
      // If parent provided an edit handler, prefer that (keeps current wiring)
      if (onEditRecord) {
        onEditRecord(record as any);
        handleCloseMenu();
        return;
      }

      // Otherwise navigate to the complete medical record form and pass record in location state
      navigate('/medical-record/complete', { state: { editingRecord: record } });
      handleCloseMenu();
    } catch (err: any) {
      console.error('Failed to load record for editing:', err);
      alert('Failed to load record for editing');
      handleCloseMenu();
    }
  };

  // Create add/update functions and expose them to parent
  useEffect(() => {
    const addRecord = async (_record: MedicalRecordData) => {
      try {
        // TODO: Uncomment when backend API is integrated
        // await loadRecords(); // Reload from API
        
        // Mock add for frontend testing - reload records
        await loadRecords();
      } catch (err) {
        console.error('Failed to reload records:', err);
      }
    };

    const updateRecord = async (_record: MedicalRecordData) => {
      try {
        // TODO: Uncomment when backend API is integrated
        // await loadRecords(); // Reload from API
        
        // Mock update for frontend testing - reload records
        await loadRecords();
      } catch (err) {
        console.error('Failed to reload records:', err);
      }
    };

    // Expose to parent via callbacks
    if (onSetAddRecord) {
      onSetAddRecord(addRecord);
    }
    if (onSetUpdateRecord) {
      onSetUpdateRecord(updateRecord);
    }
  }, [onSetAddRecord, onSetUpdateRecord]);

  const handleDownloadPDF = async (_index: number) => {
    // const record = filteredRecords[index]; // Will be used when PDF generation is implemented
    handleCloseMenu();
    
    try {
      // TODO: Uncomment when backend API is integrated
      // const fullRecord = await medicalRecordService.getById(record._id || record.id || '');
      // generateMedicalRecordPDF(fullRecord);
      
      // Mock PDF download for frontend testing
      alert('PDF download will be implemented with backend integration');
    } catch (err: any) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF');
    }
  };

  const handleDeleteRecord = async (index: number) => {
    const record = filteredRecords[index];
    if (window.confirm(`Are you sure you want to delete medical record ${record.recordId}? This action cannot be undone.`)) {
      try {
        // TODO: Uncomment when backend API is integrated
        // await medicalRecordService.delete(record._id || record.id || '');
        
        // Mock delete for frontend testing
        setRecords(prevRecords => prevRecords.filter(r => r.recordId !== record.recordId));
        handleCloseMenu();
        alert(`Record ${record.recordId} has been deleted.`);
      } catch (err: any) {
        console.error('Failed to delete record:', err);
        alert('Failed to delete record');
        handleCloseMenu();
      }
    }
  };


  return (
    <div className="medical-record-container" style={{ background: '#fff', minHeight: '100%' }}>
      <div className="header">
        <div className="header-left">
          <h1 className="title">Medical Record</h1>
          <p className="subtitle">Manage Organization</p>
        </div>
      </div>

      <div className="actions-bar">
        <button
          className="add-record-btn"
          onClick={() => (onNavigateToForm ? onNavigateToForm() : navigate('/medical-record/complete'))}
        >
          <span className="plus-icon">+</span>
          Add New Record
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h2 className="table-title">List Of Medical Record</h2>
            <p className="record-count">{filteredRecords.length} records found</p>
          </div>
          <div className="table-header-right">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search records..."
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            Loading medical records...
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
            {error}
          </div>
        ) : (
          <table className="medical-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Patient Name</th>
                <th>Patient ID</th>
                <th>Age / Gender</th>
                <th>Date of Visit</th>
                <th>Diagnosis</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                    No medical records found. Click "Add New Record" to create one.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={record._id || record.id || record.recordId}>
                    <td>{record.recordId}</td>
                    <td>{record.patient.name}</td>
                    <td>{record.patient.id}</td>
                    <td>{record.patient.age} / {record.patient.gender}</td>
                    <td>{new Date(record.visit.dateOfVisit).toLocaleDateString()}</td>
                    <td>{record.diagnosis?.diagnosis || '-'}</td>
                    <td>{record.visit.doctor}</td>
                    <td>
                      <StatusBadge status={record.status} />
                    </td>
                    <td>
                      <button 
                        className="action-btn"
                        onClick={(e) => handleActionClick(e, index)}
                      >
                        ⋮
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Menu */}
      <ActionMenu
        isOpen={activeMenu !== null}
        onClose={handleCloseMenu}
        position={menuPosition}
        onViewDetails={() => handleViewDetails(activeMenu!)}
        onEditRecord={() => handleEditRecord(activeMenu!)}
        onDownloadPDF={() => handleDownloadPDF(activeMenu!)}
        onDeleteRecord={() => handleDeleteRecord(activeMenu!)}
      />
      {/* Modal for record details */}
      <MedicalRecordDetails
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        record={selectedRecord}
      />
    </div>
  );
};

export default MedicalRecord;