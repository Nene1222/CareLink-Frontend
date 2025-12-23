import React, { useState, useEffect } from 'react';
import '../../../assets/style/medical/form/patientForm.css';
import type { Doctor, Patient } from '../../../services/api/mockUsersService';

interface PatientFormData {
  name: string;
  gender: 'Female' | 'Male' | 'Other' | '';
  dateOfBirth: string;
  age: string;
  id: string;
  address: string;
  contactNumber: string;
  dateOfVisit: string;
  doctor: string;
  accountOwner: string;
}

interface PatientFormProps {
  initialData?: {
    patient?: {
      name?: string;
      gender?: 'Female' | 'Male' | 'Other';
      dateOfBirth?: string | Date;
      age?: number;
      id?: string;
      address?: string;
      contactNumber?: string;
    };
    visit?: {
      dateOfVisit?: string | Date;
      doctor?: string;
      accountOwner?: string;
    };
  };
  doctors?: Doctor[];
  patients?: Patient[];
}

const PatientForm: React.FC<PatientFormProps> = ({ initialData, doctors = [], patients = [] }) => {
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    id: '',
    address: '',
    contactNumber: '',
    dateOfVisit: '',
    doctor: '',
    accountOwner: ''
  });
  const [accountOwnerSearchTerm, setAccountOwnerSearchTerm] = useState('');
  const [showAccountOwnerDropdown, setShowAccountOwnerDropdown] = useState(false);
  const [filteredAccountOwners, setFilteredAccountOwners] = useState<Patient[]>([]);

  // Filter account owners based on search term
  useEffect(() => {
    if (accountOwnerSearchTerm.trim()) {
      const filtered = patients.filter(accountOwner =>
        accountOwner.name.toLowerCase().includes(accountOwnerSearchTerm.toLowerCase()) ||
        accountOwner.id.toLowerCase().includes(accountOwnerSearchTerm.toLowerCase())
      );
      setFilteredAccountOwners(filtered);
      setShowAccountOwnerDropdown(filtered.length > 0);
    } else {
      setFilteredAccountOwners([]);
      setShowAccountOwnerDropdown(false);
    }
  }, [accountOwnerSearchTerm, patients]);

  // Get the selected account owner name for display
  const selectedAccountOwnerName = formData.accountOwner 
    ? patients.find(p => p.id === formData.accountOwner || p.name === formData.accountOwner)?.name || formData.accountOwner
    : '';

  const handleAccountOwnerSelect = (accountOwner: Patient) => {
    setFormData(prev => ({
      ...prev,
      accountOwner: accountOwner.name
    }));
    setAccountOwnerSearchTerm('');
    setShowAccountOwnerDropdown(false);
  };

  const handleAccountOwnerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountOwnerSearchTerm(value);
    // If the search term is cleared, clear the selected account owner
    if (!value.trim()) {
      setFormData(prev => ({
        ...prev,
        accountOwner: ''
      }));
    }
  };

  // Populate form when initialData changes
  useEffect(() => {
    if (initialData) {
      const formatDate = (date: string | Date | undefined): string => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
      };

      setFormData({
        name: initialData.patient?.name || '',
        gender: initialData.patient?.gender || '',
        dateOfBirth: formatDate(initialData.patient?.dateOfBirth),
        age: initialData.patient?.age?.toString() || '',
        id: initialData.patient?.id || '',
        address: initialData.patient?.address || '',
        contactNumber: initialData.patient?.contactNumber || '',
        dateOfVisit: formatDate(initialData.visit?.dateOfVisit),
        doctor: initialData.visit?.doctor || '',
        accountOwner: initialData.visit?.accountOwner || ''
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenderChange = (gender: 'Female' | 'Male' | 'Other') => {
    setFormData(prev => ({
      ...prev,
      gender
    }));
  };

  return (
    <div className="patient-form-wrapper">
      <div className="patient-form-container">
        {/* Header Section */}
        <div className="form-header">
          <div className="avatar-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className="header-text">
            <h2 className="form-title">Patient Demographics</h2>
            <p className="form-subtitle">Complete patient identification and contact details</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="form-content">
          {/* Account Owner and Attending Physician Row */}
          <div className="form-row">
            <div className="form-group full-width" style={{ position: 'relative' }}>
              <label className="form-label">
                <span className="form-label-hint">Optional - for reference only</span>
              </label>
              {/* Hidden input to store the account owner value for form collection */}
              <input
                type="hidden"
                name="accountOwner"
                value={formData.accountOwner}
              />
              {formData.accountOwner && !accountOwnerSearchTerm ? (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={selectedAccountOwnerName}
                    readOnly
                    className="form-input"
                    style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                    onClick={() => {
                      setAccountOwnerSearchTerm('');
                      setShowAccountOwnerDropdown(true);
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, accountOwner: '' }));
                      setAccountOwnerSearchTerm('');
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      color: '#999',
                      padding: '0',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={accountOwnerSearchTerm}
                    onChange={handleAccountOwnerSearchChange}
                    onFocus={() => {
                      if (accountOwnerSearchTerm.trim()) {
                        setShowAccountOwnerDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on dropdown item
                      setTimeout(() => setShowAccountOwnerDropdown(false), 200);
                    }}
                    className="form-input search-input"
                    placeholder="Search by account owner name or ID"
                  />
                  {showAccountOwnerDropdown && filteredAccountOwners.length > 0 && (
                    <div className="patient-dropdown">
                      {filteredAccountOwners.map((accountOwner) => (
                        <div
                          key={accountOwner.id}
                          className="patient-dropdown-item"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent onBlur from firing
                            handleAccountOwnerSelect(accountOwner);
                          }}
                        >
                          <div className="patient-dropdown-name">{accountOwner.name}</div>
                          <div className="patient-dropdown-details">
                            ID: {accountOwner.id} • Age: {accountOwner.age} • {accountOwner.gender}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="form-group full-width">
              <label className="form-label">Attending Physician</label>
              <select
                name="doctor"
                value={formData.doctor}
                onChange={handleInputChange}
                className="form-input form-select"
              >
                <option value="">Select attending physician</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor.name}>
                    {doctor.name} {doctor.role ? `- ${doctor.role}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Name and Gender Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label className="form-label">Patient Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter the patient's full legal name (not the account owner)"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Gender</label>
              <div className="gender-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.gender === 'Female'}
                    onChange={() => handleGenderChange('Female')}
                  />
                  <span className="radio-label">Female</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.gender === 'Male'}
                    onChange={() => handleGenderChange('Male')}
                  />
                  <span className="radio-label">Male</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.gender === 'Other'}
                    onChange={() => handleGenderChange('Other')}
                  />
                  <span className="radio-label">Other</span>
                </label>
              </div>
            </div>
          </div>

          {/* Date of Birth and Age Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Years"
                min="0"
                max="150"
              />
            </div>
          </div>

          {/* Address and Contact Number Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label className="form-label">Residential Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Street address, city, state, postal code"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Phone number with country code"
              />
            </div>
          </div>

          {/* Date of Visit Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label className="form-label">Date of Visit</label>
              <input
                type="date"
                name="dateOfVisit"
                value={formData.dateOfVisit}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientForm;