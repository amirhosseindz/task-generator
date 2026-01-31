import { useState, useEffect } from 'react';
import { getConfigStatus, clearConfig } from '../../services/jira.service';
import JiraOAuthButton from './JiraOAuthButton';
import MessageDialog from '../MessageDialog';
import ConfirmDialog from '../ConfirmDialog';

const JiraConnectionStatus = ({ configured: initialConfigured, onConfigChange }) => {
  const [configured, setConfigured] = useState(initialConfigured);
  const [isChecking, setIsChecking] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    setConfigured(initialConfigured);
  }, [initialConfigured]);

  const handleDisconnectClick = () => {
    setShowDisconnect(false);
    setShowDisconnectConfirm(true);
  };

  const handleDisconnectConfirm = async () => {
    setShowDisconnectConfirm(false);
    try {
      await clearConfig();
      setConfigured(false);
      if (onConfigChange) {
        onConfigChange(false);
      }
    } catch (err) {
      setErrorMessage('Failed to disconnect: ' + (err.message || 'Unknown error'));
    }
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
      <>
        <ConfirmDialog
          isOpen={showDisconnectConfirm}
          title="Disconnect from Jira?"
          message="Are you sure you want to disconnect from Jira? You will need to connect again to export tasks."
          confirmLabel="Disconnect"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleDisconnectConfirm}
          onCancel={() => setShowDisconnectConfirm(false)}
        />
        <MessageDialog
          isOpen={!!errorMessage}
          variant="error"
          title="Disconnect failed"
          message={errorMessage || undefined}
          onClose={() => setErrorMessage(null)}
        />
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
                onClick={handleDisconnectClick}
                className="w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm font-medium text-left"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </>
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
