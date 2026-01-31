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
    const systemPrompt = `You are a task extraction assistant. Analyze the provided text and determine if it is meeting minutes (notes from a meeting, discussion summary, or similar). 

If the text is NOT meeting minutes (e.g. it is a recipe, code, random text, a single phrase, or unrelated content), return ONLY this exact JSON with no other fields:
{"notMeetingMinutes": true}

If the text IS meeting minutes, extract structured tasks and return ONLY a valid JSON object with this exact structure:
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

For each task identified, provide:
- subject: A clear, concise subject/title for the task
- criteria: The acceptance criteria or definition of done
- actionItems: An array of specific action items needed to complete the task
- assignee: The person responsible (extract from meeting minutes, or "Unassigned" if not specified)
- priority: One of "high", "medium", or "low" based on urgency and importance

Do not include any markdown formatting, code blocks, or additional text. Only return the JSON object.`;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bae9a160-b71d-481f-8ab8-0f7e4f312bd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.service.js:extractTasks:entry',message:'OpenAI extractTasks called',data:{meetingMinutesLen:meetingMinutes?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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

      // Check if the input was not meeting minutes
      if (parsed.notMeetingMinutes === true) {
        const err = new Error('Please provide a valid meeting minute!');
        err.statusCode = 400;
        throw err;
      }

      // Validate the structure
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('Invalid response structure from OpenAI');
      }

      return parsed;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bae9a160-b71d-481f-8ab8-0f7e4f312bd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.service.js:catch',message:'OpenAI error',data:{errMsg:error?.message,responseStatus:error?.response?.status,hasResponse:!!error?.response},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
      // #endregion
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse OpenAI response as JSON');
      }
      throw error;
    }
  }
}

export default new OpenAIService();
