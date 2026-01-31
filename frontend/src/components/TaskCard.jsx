import { useState } from 'react';
import TaskFormModal from './TaskFormModal';
import MessageDialog from './MessageDialog';
import ConfirmDialog from './ConfirmDialog';

const TaskCard = ({ task, isSelected = false, exportedInfo = null, onUpdate, onDelete, onSelect }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleSaveFromModal = (editedTask) => {
    onUpdate(task.id, editedTask);
    setIsEditing(false);
    setSuccessMessage({ title: 'Task saved', message: 'Your changes have been saved successfully.' });
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete(task.id);
  };

  return (
    <div className="h-full">
      <TaskFormModal
        isOpen={isEditing}
        initialTask={task}
        title="Edit Task"
        onSave={handleSaveFromModal}
        onClose={() => setIsEditing(false)}
      />
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <MessageDialog
        isOpen={!!successMessage}
        variant="success"
        title={successMessage?.title}
        message={successMessage?.message}
        onClose={() => setSuccessMessage(null)}
      />
      <div className={`flex flex-col h-full bg-white rounded-lg shadow-md p-6 border-2 transition-shadow ${isSelected ? 'border-blue-500' : 'border-gray-200 hover:shadow-lg'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-2 flex-1">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(task.id)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          )}
          <h3 className="text-xl font-semibold text-gray-800 flex-1">
            {task.subject || 'Untitled Task'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
            {task.priority?.toUpperCase() || 'MEDIUM'}
          </span>
          {exportedInfo && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
              ✓ Exported
            </span>
          )}
        </div>
      </div>
      
      {task.criteria && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Criteria:</h4>
          <p className="text-gray-700 text-sm">{task.criteria}</p>
        </div>
      )}
      
      {task.actionItems && task.actionItems.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Action Items:</h4>
          <ul className="list-disc list-inside space-y-1">
            {task.actionItems.map((item, index) => (
              <li key={index} className="text-gray-700 text-sm">{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {task.assignee && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Assignee:</span> {task.assignee}
          </p>
        </div>
      )}

      {exportedInfo && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href={exportedInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View in Jira: {exportedInfo.issueKey} →
          </a>
        </div>
      )}
      
      <div className="mt-auto pt-4 border-t border-gray-200 flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Edit
        </button>
        {onDelete && (
          <button
            onClick={handleDeleteClick}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Delete
          </button>
        )}
      </div>
    </div>
    </div>
  );
};

export default TaskCard;
