import { useState } from 'react';
import PrioritySelector from './jira/PrioritySelector';
import ActionItemsEditor from './jira/ActionItemsEditor';

const TaskCard = ({ task, isSelected = false, exportedInfo = null, onUpdate, onDelete, onSelect }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({ ...task });

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

  const handleSave = () => {
    // Validate before saving
    if (!editedTask.subject || editedTask.subject.trim().length === 0) {
      alert('Subject is required');
      return;
    }
    if (editedTask.subject.length > 255) {
      alert('Subject must be 255 characters or less');
      return;
    }
    onUpdate(task.id, editedTask);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTask({ ...task });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-500">
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
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 transition-shadow ${isSelected ? 'border-blue-500' : 'border-gray-200 hover:shadow-lg'}`}>
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
      
      <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Edit
        </button>
        {onDelete && (
          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
