import { useState } from 'react';
import { initiateOAuth, openOAuthPopup } from '../../services/jira.service';

const JiraOAuthButton = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get OAuth authorization URL
      const { authorizationUrl, state } = await initiateOAuth();
      
      // Open popup and handle callback
      await openOAuthPopup(authorizationUrl, state);
      
      // Success
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to connect to Jira. Please try again.';
      setError(errorMessage);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Connecting...' : 'Connect to Jira'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default JiraOAuthButton;
