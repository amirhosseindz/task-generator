import { useState, useEffect } from 'react';
import PrioritySelector from './jira/PrioritySelector';
import ActionItemsEditor from './jira/ActionItemsEditor';
import MessageDialog from './MessageDialog';

const defaultTask = () => ({
  subject: '',
  criteria: '',
  actionItems: [],
  assignee: '',
  priority: 'Medium',
});

const TaskFormModal = ({ isOpen, initialTask, title = 'Task Details', onSave, onClose }) => {
  const [editedTask, setEditedTask] = useState(defaultTask);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setEditedTask(initialTask ? { ...defaultTask(), ...initialTask } : defaultTask());
      setValidationError(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!editedTask.subject || editedTask.subject.trim().length === 0) {
      setValidationError('Subject is required.');
      return;
    }
    if (editedTask.subject.length > 255) {
      setValidationError('Subject must be 255 characters or less.');
      return;
    }
    setValidationError(null);
    onSave(editedTask);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <MessageDialog
        isOpen={!!validationError}
        variant="error"
        title="Validation Error"
        message={validationError || undefined}
        onClose={() => setValidationError(null)}
      />
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id="task-modal-title" className="text-xl font-semibold text-gray-900 mb-4">
            {title}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editedTask.subject || ''}
                onChange={(e) => setEditedTask({ ...editedTask, subject: e.target.value })}
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Task subject"
              />
              <p className="text-xs text-gray-500 mt-1">
                {editedTask.subject?.length || 0}/255 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Criteria
              </label>
              <textarea
                value={editedTask.criteria || ''}
                onChange={(e) => setEditedTask({ ...editedTask, criteria: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Task criteria"
              />
            </div>

            <ActionItemsEditor
              items={editedTask.actionItems || []}
              onChange={(items) => setEditedTask({ ...editedTask, actionItems: items })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <input
                type="text"
                value={editedTask.assignee || ''}
                onChange={(e) => setEditedTask({ ...editedTask, assignee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Assignee name (optional)"
              />
            </div>

            <PrioritySelector
              value={editedTask.priority}
              onChange={(priority) => setEditedTask({ ...editedTask, priority })}
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Save
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default TaskFormModal;
