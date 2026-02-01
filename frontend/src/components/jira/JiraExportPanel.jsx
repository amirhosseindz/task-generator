import { useState } from 'react';
import JiraProjectSelector from './JiraProjectSelector';
import JiraIssueTypeSelector from './JiraIssueTypeSelector';
import ExportProgressModal from './ExportProgressModal';
import MessageDialog from '../MessageDialog';
import { exportTasks } from '../../services/jira.service';

const JiraExportPanel = ({ tasks, onExport, onClose }) => {
  const [projectKey, setProjectKey] = useState('');
  const [issueType, setIssueType] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [validationMessage, setValidationMessage] = useState(null);

  const handleExport = async () => {
    if (!projectKey || !issueType) {
      setValidationMessage('Please select both a project and issue type.');
      return;
    }

    if (!tasks || tasks.length === 0) {
      setValidationMessage('No tasks to export.');
      return;
    }

    setIsExporting(true);
    setShowProgressModal(true);
    setProgress('Exporting tasks to Jira...');
    setResults([]);
    setErrors([]);

    try {
      const exportResults = await exportTasks(tasks, projectKey, issueType);
      
      // Process results
      const successful = [];
      const failed = [];

      // Handle array format (legacy)
      if (Array.isArray(exportResults)) {
        exportResults.forEach((result) => {
          if (result.issueKey && result.taskId) {
            successful.push({
              taskId: result.taskId,
              issueKey: result.issueKey,
              url: result.url,
              taskSubject: tasks.find(t => t.id === result.taskId)?.subject,
            });
          } else {
            failed.push({
              taskId: result.taskId,
              message: result.error || 'Export failed',
              taskSubject: tasks.find(t => t.id === result.taskId)?.subject,
            });
          }
        });
      } 
      // Handle object format (current backend format: { taskId: { issueKey, url, success } })
      else if (exportResults.results && typeof exportResults.results === 'object') {
        Object.entries(exportResults.results).forEach(([taskId, result]) => {
          if (result.success && result.issueKey) {
            successful.push({
              taskId: taskId,
              issueKey: result.issueKey,
              url: result.url,
              taskSubject: tasks.find(t => t.id === taskId)?.subject,
            });
          } else {
            failed.push({
              taskId: taskId,
              message: result.error || 'Export failed',
              taskSubject: tasks.find(t => t.id === taskId)?.subject,
            });
          }
        });
      } 
      // Handle error response
      else if (exportResults.error) {
        failed.push({
          message: exportResults.error.message || exportResults.error,
        });
      }

      setResults(successful);
      setErrors(failed);
      setProgress(null);

      // Call parent callback with results (parent will show success message)
      if (onExport && successful.length > 0) {
        onExport(successful);
      }
    } catch (err) {
      setProgress(null);
      setErrors([
        {
          message: err.message || 'Failed to export tasks to Jira',
        },
      ]);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCloseModal = () => {
    setShowProgressModal(false);
    if (!isExporting) {
      // Only close panel if export is complete
      // User can close modal but keep panel open to export more
    }
  };


  return (
    <>
      <MessageDialog
        isOpen={!!validationMessage}
        variant="error"
        title="Export"
        message={validationMessage || undefined}
        onClose={() => setValidationMessage(null)}
      />
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Export to Jira</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>{tasks.length}</strong> task{tasks.length !== 1 ? 's' : ''} will be exported to Jira.
            </p>
          </div>

          <JiraProjectSelector
            value={projectKey}
            onChange={setProjectKey}
          />

          <JiraIssueTypeSelector
            projectKey={projectKey}
            value={issueType}
            onChange={setIssueType}
          />

          {/* Task Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasks to Export ({tasks.length})
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
              <ul className="space-y-1">
                {tasks.map((task) => (
                  <li key={task.id} className="text-sm text-gray-700">
                    • {task.subject || 'Untitled Task'}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleExport}
              disabled={!projectKey || !issueType || isExporting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Confirm Export'}
            </button>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <ExportProgressModal
        isOpen={showProgressModal}
        onClose={handleCloseModal}
        progress={progress}
        results={results}
        errors={errors}
      />
    </>
  );
};

export default JiraExportPanel;
