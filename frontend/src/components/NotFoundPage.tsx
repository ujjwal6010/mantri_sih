import React from 'react';
import { ShieldX } from 'lucide-react';

export const NotFoundPage: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <ShieldX size={64} className="not-found-icon" />
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Access Denied or Page Not Found</h2>
        <p className="not-found-desc">
          The intelligence module you are looking for does not exist or has been restricted.
          Please return to the main dashboard.
        </p>
        <button className="not-found-btn" onClick={onGoHome}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
