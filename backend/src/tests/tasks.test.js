import request from 'supertest';
import app from '../index.js';
import openaiService from '../services/openai.service.js';

// Mock the OpenAI service
jest.mock('../services/openai.service.js', () => ({
  extractTasks: jest.fn(),
}));

describe('Task Generation Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/tasks/generate', () => {
    const validMeetingMinutes = `
      Meeting Minutes - Project Planning
      
      Attendees: John, Sarah, Mike
      
      Action Items:
      1. John will complete the API documentation by Friday
      2. Sarah needs to review the design mockups
      3. Mike should set up the CI/CD pipeline
      
      Next Steps:
      - Schedule follow-up meeting
      - Review progress next week
    `;

    const mockTasksResponse = {
      tasks: [
        {
          subject: 'Complete API Documentation',
          criteria: 'All API endpoints documented with examples',
          actionItems: ['Write endpoint documentation', 'Add request/response examples'],
          assignee: 'John',
          priority: 'high',
        },
        {
          subject: 'Review Design Mockups',
          criteria: 'All design mockups reviewed and approved',
          actionItems: ['Review mockups', 'Provide feedback'],
          assignee: 'Sarah',
          priority: 'medium',
        },
        {
          subject: 'Set up CI/CD Pipeline',
          criteria: 'CI/CD pipeline configured and tested',
          actionItems: ['Configure GitHub Actions', 'Test deployment'],
          assignee: 'Mike',
          priority: 'high',
        },
      ],
    };

    it('should generate tasks successfully with valid input', async () => {
      openaiService.extractTasks.mockResolvedValue(mockTasksResponse);

      const response = await request(app)
        .post('/api/tasks/generate')
        .send({ meetingMinutes: validMeetingMinutes })
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks.length).toBeGreaterThan(0);
      
      // Verify task structure
      response.body.tasks.forEach((task) => {
        expect(task).toHaveProperty('subject');
        expect(task).toHaveProperty('criteria');
        expect(task).toHaveProperty('actionItems');
        expect(task).toHaveProperty('assignee');
        expect(task).toHaveProperty('priority');
        expect(['high', 'medium', 'low']).toContain(task.priority);
        expect(Array.isArray(task.actionItems)).toBe(true);
      });

      expect(openaiService.extractTasks).toHaveBeenCalledWith(validMeetingMinutes);
    });

    it('should return 400 when meetingMinutes is missing', async () => {
      const response = await request(app)
        .post('/api/tasks/generate')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(openaiService.extractTasks).not.toHaveBeenCalled();
    });

    it('should return 400 when meetingMinutes is empty', async () => {
      const response = await request(app)
        .post('/api/tasks/generate')
        .send({ meetingMinutes: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(openaiService.extractTasks).not.toHaveBeenCalled();
    });

    it('should return 400 when meetingMinutes is too short', async () => {
      const response = await request(app)
        .post('/api/tasks/generate')
        .send({ meetingMinutes: 'short' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(openaiService.extractTasks).not.toHaveBeenCalled();
    });

    it('should return 400 when meetingMinutes is only whitespace', async () => {
      const response = await request(app)
        .post('/api/tasks/generate')
        .send({ meetingMinutes: '   \n\t  ' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(openaiService.extractTasks).not.toHaveBeenCalled();
    });

    it('should handle OpenAI service errors gracefully', async () => {
      const error = new Error('OpenAI API error');
      openaiService.extractTasks.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/tasks/generate')
        .send({ meetingMinutes: validMeetingMinutes })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(openaiService.extractTasks).toHaveBeenCalled();
    });

    it('should handle OpenAI API response errors', async () => {
      const apiError = {
        response: {
          status: 429,
        },
        message: 'Rate limit exceeded',
      };
      openaiService.extractTasks.mockRejectedValue(apiError);

      const response = await request(app)
        .post('/api/tasks/generate')
        .send({ meetingMinutes: validMeetingMinutes })
        .expect(429);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept meeting minutes with minimum length', async () => {
      const minLengthMinutes = '1234567890'; // Exactly 10 characters
      openaiService.extractTasks.mockResolvedValue({ tasks: [] });

      const response = await request(app)
        .post('/api/tasks/generate')
        .send({ meetingMinutes: minLengthMinutes })
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(openaiService.extractTasks).toHaveBeenCalledWith(minLengthMinutes);
    });

    it('should handle very long meeting minutes', async () => {
      const longMinutes = 'A'.repeat(10000);
      openaiService.extractTasks.mockResolvedValue({ tasks: [] });

      const response = await request(app)
        .post('/api/tasks/generate')
        .send({ meetingMinutes: longMinutes })
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(openaiService.extractTasks).toHaveBeenCalled();
    });
  });
});
