const PrioritySelector = ({ value, onChange, className = '' }) => {
  const priorities = [
    { value: 'High', label: 'High', color: 'bg-red-100 text-red-800 border-red-300' },
    { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 'Low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-300' },
  ];

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.color || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Priority
      </label>
      <select
        value={value || 'Medium'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {priorities.map(priority => (
          <option key={priority.value} value={priority.value}>
            {priority.label}
          </option>
        ))}
      </select>
      <div className="mt-1">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(value || 'Medium')}`}>
          {value || 'Medium'}
        </span>
      </div>
    </div>
  );
};

export default PrioritySelector;
