import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * OpenAI service for generating tasks from meeting minutes
 */
class OpenAIService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });

    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Extract tasks from meeting minutes using OpenAI
   * @param {string} meetingMinutes - The meeting minutes text
   * @returns {Promise<Object>} Structured task data
   */
  async extractTasks(meetingMinutes) {
    const systemPrompt = `You are a task extraction assistant. Analyze meeting minutes and extract structured tasks.

For each task identified, provide:
- subject: A clear, concise subject/title for the task
- criteria: The acceptance criteria or definition of done
- actionItems: An array of specific action items needed to complete the task
- assignee: The person responsible (extract from meeting minutes, or "Unassigned" if not specified)
- priority: One of "high", "medium", or "low" based on urgency and importance

Return ONLY a valid JSON object with this exact structure:
{
  "tasks": [
    {
      "subject": "string",
      "criteria": "string",
      "actionItems": ["string"],
      "assignee": "string",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Do not include any markdown formatting, code blocks, or additional text. Only return the JSON object.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: meetingMinutes },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse the JSON response
      const parsed = JSON.parse(content);
      
      // Validate the structure
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('Invalid response structure from OpenAI');
      }

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse OpenAI response as JSON');
      }
      throw error;
    }
  }
}

export default new OpenAIService();
