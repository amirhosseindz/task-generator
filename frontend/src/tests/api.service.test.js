import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { generateTasks, healthCheck } from '../services/api.service';

// Mock axios
vi.mock('axios');
const mockedAxios = axios;

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset axios.create mock
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateTasks', () => {
    it('successfully generates tasks', async () => {
      const mockResponse = {
        data: {
          tasks: [
            {
              subject: 'Test Task',
              criteria: 'Test criteria',
              actionItems: ['Action 1', 'Action 2'],
              assignee: 'John Doe',
              priority: 'high'
            }
          ]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await generateTasks('Meeting minutes text');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/tasks/generate',
        { meetingMinutes: 'Meeting minutes text' }
      );
    });

    it('handles API errors with response', async () => {
      const errorResponse = {
        response: {
          data: {
            message: 'Invalid input'
          },
          status: 400
        }
      };

      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(generateTasks('Invalid text')).rejects.toThrow('Invalid input');
    });

    it('handles network errors', async () => {
      const networkError = {
        request: {},
        message: 'Network Error'
      };

      mockedAxios.post.mockRejectedValue(networkError);

      await expect(generateTasks('Meeting minutes')).rejects.toThrow(
        'Network error: Unable to reach the server'
      );
    });

    it('handles errors without response or request', async () => {
      const genericError = {
        message: 'Something went wrong'
      };

      mockedAxios.post.mockRejectedValue(genericError);

      await expect(generateTasks('Meeting minutes')).rejects.toThrow('Something went wrong');
    });

    it('handles errors with error.data.message', async () => {
      const errorWithData = {
        response: {
          data: {
            error: 'Server error occurred'
          },
          status: 500
        }
      };

      mockedAxios.post.mockRejectedValue(errorWithData);

      await expect(generateTasks('Meeting minutes')).rejects.toThrow('Server error occurred');
    });
  });

  describe('healthCheck', () => {
    it('successfully performs health check', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await healthCheck();

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/health');
    });

    it('handles health check errors', async () => {
      const errorResponse = {
        response: {
          data: {
            message: 'Service unavailable'
          },
          status: 503
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      await expect(healthCheck()).rejects.toThrow('Service unavailable');
    });
  });
});
