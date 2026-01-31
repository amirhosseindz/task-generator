import { useState, useEffect } from 'react';
import { getIssueTypes } from '../../services/jira.service';

const JiraIssueTypeSelector = ({ projectKey, value, onChange, className = '' }) => {
  const [issueTypes, setIssueTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectKey) {
      setIssueTypes([]);
      return;
    }

    const loadIssueTypes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getIssueTypes(projectKey);
        setIssueTypes(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load issue types');
      } finally {
        setIsLoading(false);
      }
    };

    loadIssueTypes();
  }, [projectKey]);

  if (!projectKey) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue Type
        </label>
        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
          <p className="text-sm text-gray-500">Select a project first</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue Type
        </label>
        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
          <p className="text-sm text-gray-500">Loading issue types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue Type
        </label>
        <div className="px-3 py-2 border border-red-300 rounded-md bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Issue Type <span className="text-red-500">*</span>
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
        disabled={!projectKey}
      >
        <option value="">Select an issue type...</option>
        {issueTypes.map((type) => (
          <option key={type.id || type.name} value={type.id || type.name}>
            {type.name}
            {type.description && ` - ${type.description}`}
          </option>
        ))}
      </select>
      {issueTypes.length === 0 && projectKey && (
        <p className="mt-1 text-sm text-gray-500">No issue types available</p>
      )}
    </div>
  );
};

export default JiraIssueTypeSelector;
