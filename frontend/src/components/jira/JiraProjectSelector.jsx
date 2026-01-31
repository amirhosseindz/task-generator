import { useState, useEffect } from 'react';
import { getProjects } from '../../services/jira.service';

const JiraProjectSelector = ({ value, onChange, className = '' }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProjects();
        setProjects(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.key?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project
        </label>
        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
          <p className="text-sm text-gray-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project
        </label>
        <div className="px-3 py-2 border border-red-300 rounded-md bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Project <span className="text-red-500">*</span>
      </label>
      {projects.length > 10 && (
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search projects..."
          className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      )}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      >
        <option value="">Select a project...</option>
        {filteredProjects.map((project) => (
          <option key={project.key || project.id} value={project.key || project.id}>
            {project.name} ({project.key})
          </option>
        ))}
      </select>
      {projects.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No projects available</p>
      )}
    </div>
  );
};

export default JiraProjectSelector;
