const ExportProgressModal = ({ isOpen, onClose, progress, results, errors }) => {
  if (!isOpen) return null;

  const successful = results?.filter(r => r.issueKey) || [];
  const failed = errors || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Export Results</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {progress && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">{progress}</p>
              </div>
            </div>
          )}

          {!progress && (
            <>
              {successful.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    ✓ Successfully Exported ({successful.length})
                  </h3>
                  <div className="space-y-2">
                    {successful.map((result, index) => (
                      <div
                        key={index}
                        className="p-3 bg-green-50 border border-green-200 rounded-md"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-green-900">
                              {result.taskSubject || `Task ${index + 1}`}
                            </p>
                            <p className="text-sm text-green-700">
                              Issue: {result.issueKey}
                            </p>
                          </div>
                          {result.url && (
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              View →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {failed.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-3">
                    ✗ Failed ({failed.length})
                  </h3>
                  <div className="space-y-2">
                    {failed.map((error, index) => (
                      <div
                        key={index}
                        className="p-3 bg-red-50 border border-red-200 rounded-md"
                      >
                        <p className="font-medium text-red-900">
                          {error.taskSubject || `Task ${index + 1}`}
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          {error.message || 'Unknown error occurred'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {successful.length === 0 && failed.length === 0 && (
                <div className="mb-6">
                  <p className="text-gray-600">No results to display.</p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportProgressModal;
