import { useEffect, useRef, useState } from 'react';
import TaskCard from './TaskCard';
import TaskFormModal from './TaskFormModal';
import MessageDialog from './MessageDialog';
import ConfirmDialog from './ConfirmDialog';

const TaskList = ({
  tasks,
  selectedTasks = new Set(),
  exportedTasks = new Map(),
  onUpdate,
  onDelete,
  onAdd,
  onSelect,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onExport,
}) => {
  const checkboxRef = useRef(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No tasks generated yet. Submit meeting minutes to generate tasks.</p>
      </div>
    );
  }

  const allSelected = tasks.length > 0 && tasks.every(task => selectedTasks.has(task.id));
  const someSelected = Array.from(selectedTasks).length > 0 && !allSelected;
  const selectedCount = selectedTasks.size;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleDeleteTask = (taskId) => {
    onDelete(taskId);
    setSuccessMessage({ title: 'Task deleted', message: 'The task has been deleted successfully.' });
  };

  return (
    <div>
      {/* Bulk Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={allSelected}
            onChange={() => {
              if (allSelected) {
                onDeselectAll();
              } else {
                onSelectAll();
              }
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2">
          {onAdd && (
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              + Add New Task
            </button>
          )}
          {onDeleteSelected && selectedCount > 0 && (
            <button
              onClick={() => setShowDeleteSelectedConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Delete Selected ({selectedCount})
            </button>
          )}
          {onExport && selectedCount > 0 && (
            <button
              onClick={onExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Export Selected to Jira ({selectedCount})
            </button>
          )}
          {onExport && selectedCount === 0 && (
            <button
              onClick={onExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Export All to Jira
            </button>
          )}
        </div>
      </div>

      <TaskFormModal
        isOpen={showAddTaskModal}
        initialTask={null}
        title="Add New Task"
        onSave={(taskData) => {
          onAdd(taskData);
          setShowAddTaskModal(false);
          setSuccessMessage({ title: 'Task added', message: 'Your new task has been added successfully.' });
        }}
        onClose={() => setShowAddTaskModal(false)}
      />
      <ConfirmDialog
        isOpen={showDeleteSelectedConfirm}
        title="Delete selected tasks?"
        message={`Are you sure you want to delete ${selectedCount} selected task(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          onDeleteSelected();
          setShowDeleteSelectedConfirm(false);
          setSuccessMessage({ title: 'Tasks deleted', message: 'The selected tasks have been deleted successfully.' });
        }}
        onCancel={() => setShowDeleteSelectedConfirm(false)}
      />
      <MessageDialog
        isOpen={!!successMessage}
        variant="success"
        title={successMessage?.title}
        message={successMessage?.message}
        onClose={() => setSuccessMessage(null)}
      />

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedTasks.has(task.id)}
            exportedInfo={exportedTasks.get(task.id) || null}
            onUpdate={onUpdate}
            onDelete={handleDeleteTask}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
