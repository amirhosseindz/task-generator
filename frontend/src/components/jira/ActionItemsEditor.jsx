const ActionItemsEditor = ({ items = [], onChange, className = '' }) => {
  const handleAdd = () => {
    onChange([...items, '']);
  };

  const handleRemove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Action Items
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add Item
        </button>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No action items. Click "Add Item" to add one.</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="text"
                value={item}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={`Action item ${index + 1}`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActionItemsEditor;
