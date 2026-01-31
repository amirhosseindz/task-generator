const TaskCard = ({ task }) => {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex-1">
          {task.subject || 'Untitled Task'}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
          {task.priority?.toUpperCase() || 'MEDIUM'}
        </span>
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
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Assignee:</span> {task.assignee}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
