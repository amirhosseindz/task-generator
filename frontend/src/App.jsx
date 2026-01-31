import { useState } from 'react';
import MeetingMinutesInput from './components/MeetingMinutesInput';
import TaskList from './components/TaskList';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { generateTasks } from './services/api.service';

function App() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    setTasks([]);

    try {
      const response = await generateTasks(data.meetingMinutes);
      if (response && response.tasks) {
        setTasks(response.tasks);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Task Generator
          </h1>
          <p className="text-gray-600">
            Transform your meeting minutes into actionable tasks using AI
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <MeetingMinutesInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {isLoading && <LoadingSpinner />}

        {error && !isLoading && (
          <div className="mb-8">
            <ErrorMessage message={error} onRetry={handleRetry} />
          </div>
        )}

        {!isLoading && !error && tasks.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Generated Tasks ({tasks.length})
            </h2>
            <TaskList tasks={tasks} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
