import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import * as apiService from '../services/api.service';

// Mock the API service
vi.mock('../services/api.service');

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main heading', () => {
    render(<App />);
    expect(screen.getByText('Task Generator')).toBeInTheDocument();
  });

  it('renders the meeting minutes input form', () => {
    render(<App />);
    expect(screen.getByLabelText(/meeting minutes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate tasks/i })).toBeInTheDocument();
  });

  it('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<App />);

    const submitButton = screen.getByRole('button', { name: /generate tasks/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/meeting minutes are required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short input', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText(/meeting minutes/i);
    await user.type(textarea, 'short');

    const submitButton = screen.getByRole('button', { name: /generate tasks/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must be at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form and displays tasks on success', async () => {
    const mockTasks = [
      {
        subject: 'Implement new feature',
        criteria: 'Feature must be tested',
        actionItems: ['Write tests', 'Deploy'],
        assignee: 'John Doe',
        priority: 'high'
      },
      {
        subject: 'Update documentation',
        criteria: 'Document all changes',
        actionItems: ['Update README'],
        assignee: 'Jane Smith',
        priority: 'medium'
      }
    ];

    apiService.generateTasks.mockResolvedValue({ tasks: mockTasks });

    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText(/meeting minutes/i);
    await user.type(textarea, 'This is a long enough meeting minutes text to pass validation.');

    const submitButton = screen.getByRole('button', { name: /generate tasks/i });
    await user.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/generating tasks/i)).toBeInTheDocument();
    });

    // Should show tasks after loading
    await waitFor(() => {
      expect(screen.getByText(/generated tasks/i)).toBeInTheDocument();
      expect(screen.getByText('Implement new feature')).toBeInTheDocument();
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });

    expect(apiService.generateTasks).toHaveBeenCalledWith(
      'This is a long enough meeting minutes text to pass validation.'
    );
  });

  it('displays error message on API failure', async () => {
    const errorMessage = 'Failed to generate tasks';
    apiService.generateTasks.mockRejectedValue(new Error(errorMessage));

    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText(/meeting minutes/i);
    await user.type(textarea, 'This is a long enough meeting minutes text to pass validation.');

    const submitButton = screen.getByRole('button', { name: /generate tasks/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('allows retry after error', async () => {
    const mockTasks = [
      {
        subject: 'Test Task',
        criteria: 'Test criteria',
        actionItems: ['Action 1'],
        assignee: 'Test User',
        priority: 'low'
      }
    ];

    // First call fails, second succeeds
    apiService.generateTasks
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ tasks: mockTasks });

    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText(/meeting minutes/i);
    await user.type(textarea, 'This is a long enough meeting minutes text to pass validation.');

    const submitButton = screen.getByRole('button', { name: /generate tasks/i });
    await user.click(submitButton);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });
  });
});
