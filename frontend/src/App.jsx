import { useState, useEffect } from 'react';
import MeetingMinutesInput from './components/MeetingMinutesInput';
import TaskList from './components/TaskList';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import MessageDialog from './components/MessageDialog';
import JiraConnectionStatus from './components/jira/JiraConnectionStatus';
import JiraExportPanel from './components/jira/JiraExportPanel';
import { generateTasks } from './services/api.service';
import { getConfigStatus } from './services/jira.service';

function App() {
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [exportedTasks, setExportedTasks] = useState(new Map());
  const [jiraConfigured, setJiraConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState(null);

  // Generate UUID for tasks
  const generateTaskId = () => {
    return crypto.randomUUID();
  };

  // Check Jira configuration status on mount
  useEffect(() => {
    const checkJiraStatus = async () => {
      try {
        const status = await getConfigStatus();
        setJiraConfigured(status.authenticated);
      } catch (err) {
        // Silently fail - Jira not configured yet
        setJiraConfigured(false);
      }
    };
    checkJiraStatus();
  }, []);

  const handleSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    setTasks([]);
    setSelectedTasks(new Set());
    setExportedTasks(new Map());

    try {
      const response = await generateTasks(data.meetingMinutes);
      if (response && response.tasks) {
        // Add unique IDs to each task
        const tasksWithIds = response.tasks.map(task => ({
          ...task,
          id: generateTaskId(),
        }));
        setTasks(tasksWithIds);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      const msg = err.message || 'Failed to generate tasks. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
  };

  // Task management functions
  const updateTask = (taskId, updatedData) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updatedData } : task
      )
    );
  };

  const deleteTask = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
    setExportedTasks(prev => {
      const newMap = new Map(prev);
      newMap.delete(taskId);
      return newMap;
    });
  };

  const addNewTask = (taskData) => {
    const newTask = {
      id: generateTaskId(),
      subject: taskData?.subject ?? 'New Task',
      criteria: taskData?.criteria ?? '',
      actionItems: taskData?.actionItems ?? [],
      assignee: taskData?.assignee ?? '',
      priority: taskData?.priority ?? 'Medium',
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const selectTask = (taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectAllTasks = () => {
    setSelectedTasks(new Set(tasks.map(task => task.id)));
  };

  const deselectAllTasks = () => {
    setSelectedTasks(new Set());
  };

  const deleteSelectedTasks = () => {
    setTasks(prevTasks => prevTasks.filter(task => !selectedTasks.has(task.id)));
    setExportedTasks(prev => {
      const newMap = new Map(prev);
      selectedTasks.forEach(taskId => newMap.delete(taskId));
      return newMap;
    });
    setSelectedTasks(new Set());
  };

  const handleExportResults = (results) => {
    // results is an array of { taskId, issueKey, url }
    const newExportedTasks = new Map(exportedTasks);
    results.forEach(({ taskId, issueKey, url }) => {
      if (taskId && issueKey) {
        newExportedTasks.set(taskId, { issueKey, url });
      }
    });
    setExportedTasks(newExportedTasks);
    
    // Show success message in parent component
    if (results.length > 0) {
      setExportSuccessMessage(
        `Successfully exported ${results.length} task${results.length !== 1 ? 's' : ''} to Jira!`
      );
    }
    
    setShowExportPanel(false);
  };

  const handleJiraConfigChange = (configured) => {
    setJiraConfigured(configured);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MessageDialog
        isOpen={!!exportSuccessMessage}
        variant="success"
        title="Export Successful"
        message={exportSuccessMessage || undefined}
        onClose={() => setExportSuccessMessage(null)}
      />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Task Generator
            </h1>
            <p className="text-gray-600">
              Transform your meeting minutes into actionable tasks using AI
            </p>
          </div>
          <JiraConnectionStatus 
            configured={jiraConfigured} 
            onConfigChange={handleJiraConfigChange}
          />
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Generated Tasks ({tasks.length})
              </h2>
              {jiraConfigured && (
                <button
                  onClick={() => setShowExportPanel(!showExportPanel)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showExportPanel ? 'Hide Export' : 'Export to Jira'}
                </button>
              )}
            </div>
            
            {showExportPanel && jiraConfigured && (
              <div className="mb-6">
                <JiraExportPanel
                  tasks={tasks.filter(task => selectedTasks.has(task.id) || selectedTasks.size === 0)}
                  onExport={handleExportResults}
                  onClose={() => setShowExportPanel(false)}
                />
              </div>
            )}

            <TaskList
              tasks={tasks}
              selectedTasks={selectedTasks}
              exportedTasks={exportedTasks}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onAdd={addNewTask}
              onSelect={selectTask}
              onSelectAll={selectAllTasks}
              onDeselectAll={deselectAllTasks}
              onDeleteSelected={deleteSelectedTasks}
              onExport={() => setShowExportPanel(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
