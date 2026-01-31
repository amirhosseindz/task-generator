import request from 'supertest';
import app from '../index.js';

describe('Health Check Endpoint', () => {
  describe('GET /api/tasks/health', () => {
    it('should return 200 with status ok and timestamp', async () => {
      const response = await request(app)
        .get('/api/tasks/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
      
      // Verify timestamp is valid ISO string
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/tasks/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Task Generator API');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });
});
