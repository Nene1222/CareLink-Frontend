import React from 'react';
import "../../assets/style/medical/statusBage.css";

interface StatusBadgeProps {
  status: 'Completed' | 'Draft';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;