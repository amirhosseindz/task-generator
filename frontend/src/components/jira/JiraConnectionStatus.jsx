import { useState, useEffect } from 'react';
import { getConfigStatus, clearConfig } from '../../services/jira.service';
import JiraOAuthButton from './JiraOAuthButton';

const JiraConnectionStatus = ({ configured: initialConfigured, onConfigChange }) => {
  const [configured, setConfigured] = useState(initialConfigured);
  const [isChecking, setIsChecking] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);

  useEffect(() => {
    setConfigured(initialConfigured);
  }, [initialConfigured]);

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect from Jira?')) {
      try {
        await clearConfig();
        setConfigured(false);
        if (onConfigChange) {
          onConfigChange(false);
        }
      } catch (err) {
        alert('Failed to disconnect: ' + (err.message || 'Unknown error'));
      }
    }
    setShowDisconnect(false);
  };

  const handleOAuthSuccess = async () => {
    setIsChecking(true);
    try {
      const status = await getConfigStatus();
      setConfigured(status.authenticated);
      if (onConfigChange) {
        onConfigChange(status.authenticated);
      }
    } catch (err) {
      // Silently fail
    } finally {
      setIsChecking(false);
    }
  };

  if (configured) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDisconnect(!showDisconnect)}
          className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors font-medium text-sm border border-green-300"
        >
          ✓ Connected to Jira
        </button>
        {showDisconnect && (
          <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10 min-w-[200px]">
            <button
              onClick={handleDisconnect}
              className="w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm font-medium text-left"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {isChecking ? (
        <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md text-sm">
          Checking connection...
        </div>
      ) : (
        <JiraOAuthButton onSuccess={handleOAuthSuccess} />
      )}
    </div>
  );
};

export default JiraConnectionStatus;
