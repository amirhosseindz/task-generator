# API Documentation

Complete API reference for the Task Generator application, including task generation and Jira integration endpoints.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://api.your-domain.com`

## Authentication

Most endpoints do not require authentication. Jira integration endpoints require OAuth 2.1 authentication via session-based tokens stored after OAuth flow completion.

## Response Format

All responses are JSON objects. Error responses follow this format:

```json
{
  "error": {
    "message": "Error message",
    "details": [] // Optional: Array of validation errors
  }
}
```

## Task Endpoints

### Generate Tasks

**POST** `/api/tasks/generate`

Extracts structured tasks from meeting minutes using OpenAI GPT models.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "meetingMinutes": "Meeting minutes text here..."
}
```

**Request Validation:**
- `meetingMinutes` (required): String, minimum 10 characters

**Success Response** (200 OK):
```json
{
  "tasks": [
    {
      "subject": "Implement user authentication",
      "criteria": "Users can log in with email and password, session is maintained for 24 hours",
      "actionItems": [
        "Set up authentication middleware",
        "Create login endpoint",
        "Implement session management"
      ],
      "assignee": "John Doe",
      "priority": "high"
    },
    {
      "subject": "Database migration",
      "criteria": "Migrate user data to new schema without downtime",
      "actionItems": [
        "Create migration scripts",
        "Test migration on staging",
        "Schedule production migration"
      ],
      "assignee": "Sarah Smith",
      "priority": "medium"
    }
  ]
}
```

**Error Responses:**

- **400 Bad Request**: Validation error
```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "msg": "meetingMinutes must be at least 10 characters long",
        "param": "meetingMinutes",
        "location": "body"
      }
    ]
  }
}
```

- **500 Internal Server Error**: Server or OpenAI API error
```json
{
  "error": {
    "message": "Failed to generate tasks. Please try again."
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/tasks/generate \
  -H "Content-Type: application/json" \
  -d '{
    "meetingMinutes": "Team meeting notes: Need to implement authentication, update database schema, and deploy new features."
  }'
```

### Health Check

**GET** `/api/tasks/health`

Returns the health status of the API.

**Success Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example Request:**
```bash
curl http://localhost:5000/api/tasks/health
```

### Root Endpoint

**GET** `/`

Returns API information.

**Success Response** (200 OK):
```json
{
  "message": "Task Generator API",
  "version": "1.0.0"
}
```

## Jira Integration Endpoints

All Jira endpoints require OAuth authentication. Users must complete the OAuth flow via `/api/jira/oauth/authorize` and `/api/jira/oauth/callback` before accessing other Jira endpoints.

### OAuth Authorization

**GET** `/api/jira/oauth/authorize`

Initiates OAuth 2.1 flow and returns the authorization URL.

**Success Response** (200 OK):
```json
{
  "authorizationUrl": "https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=...&scope=...&redirect_uri=...&state=...&response_type=code&prompt=consent",
  "state": "random-state-string-for-csrf-protection"
}
```

**Note:** The `state` parameter is stored in the session and must be validated in the callback.

**Example Request:**
```bash
curl http://localhost:5000/api/jira/oauth/authorize
```

### OAuth Callback

**POST** `/api/jira/oauth/callback`

Handles OAuth callback and exchanges authorization code for access tokens.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "authorization-code-from-atlassian",
  "state": "state-string-from-authorize-endpoint"
}
```

**Request Validation:**
- `code` (required): String, authorization code from Atlassian
- `state` (required): String, must match state from authorize endpoint

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "OAuth authentication successful"
}
```

**Error Responses:**

- **400 Bad Request**: Validation error or invalid state
```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "msg": "Authorization code is required",
        "param": "code",
        "location": "body"
      }
    ]
  }
}
```

- **400 Bad Request**: Invalid state parameter (CSRF protection)
```json
{
  "error": {
    "message": "Invalid state parameter"
  }
}
```

- **500 Internal Server Error**: OAuth token exchange failed
```json
{
  "error": {
    "message": "OAuth token exchange failed: [error details]"
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/jira/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "abc123...",
    "state": "xyz789..."
  }'
```

### Configuration Status

**GET** `/api/jira/config/status`

Checks if Jira is authenticated (has valid OAuth tokens in session).

**Success Response** (200 OK):
```json
{
  "authenticated": true,
  "hasTokens": true
}
```

**Unauthenticated Response** (200 OK):
```json
{
  "authenticated": false,
  "hasTokens": false
}
```

**Example Request:**
```bash
curl http://localhost:5000/api/jira/config/status
```

### Clear Configuration

**DELETE** `/api/jira/config`

Clears OAuth tokens from session, effectively disconnecting from Jira.

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Jira configuration cleared"
}
```

**Example Request:**
```bash
curl -X DELETE http://localhost:5000/api/jira/config
```

### List Projects

**GET** `/api/jira/projects`

Lists available Jira projects accessible with the current OAuth token.

**Success Response** (200 OK):
```json
{
  "projects": [
    {
      "key": "PROJ",
      "id": "10000",
      "name": "My Project",
      "projectTypeKey": "software"
    },
    {
      "key": "TEST",
      "id": "10001",
      "name": "Test Project",
      "projectTypeKey": "business"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized**: Not authenticated
```json
{
  "error": {
    "message": "Not authenticated. Please connect to Jira first."
  }
}
```

- **500 Internal Server Error**: Failed to fetch projects
```json
{
  "error": {
    "message": "Failed to get projects"
  }
}
```

**Example Request:**
```bash
curl http://localhost:5000/api/jira/projects
```

### Get Issue Types

**GET** `/api/jira/issue-types/:projectKey`

Gets available issue types for a specific Jira project.

**URL Parameters:**
- `projectKey` (required): Project key (uppercase letters only, e.g., "PROJ")

**Success Response** (200 OK):
```json
{
  "issueTypes": [
    {
      "id": "10001",
      "name": "Task",
      "description": "A task that needs to be done."
    },
    {
      "id": "10002",
      "name": "Story",
      "description": "A user story."
    },
    {
      "id": "10003",
      "name": "Bug",
      "description": "A problem that needs to be fixed."
    }
  ]
}
```

**Error Responses:**

- **400 Bad Request**: Validation error
```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "msg": "Project key must be uppercase letters only",
        "param": "projectKey",
        "location": "params"
      }
    ]
  }
}
```

- **401 Unauthorized**: Not authenticated
```json
{
  "error": {
    "message": "Not authenticated. Please connect to Jira first."
  }
}
```

- **500 Internal Server Error**: Failed to fetch issue types
```json
{
  "error": {
    "message": "Failed to get project issue types"
  }
}
```

**Example Request:**
```bash
curl http://localhost:5000/api/jira/issue-types/PROJ
```

### Export Tasks to Jira

**POST** `/api/jira/export`

Exports tasks to Jira by creating issues using direct Jira REST API calls.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "tasks": [
    {
      "id": "task-uuid-1",
      "subject": "Implement user authentication",
      "criteria": "Users can log in with email and password",
      "actionItems": [
        "Set up authentication middleware",
        "Create login endpoint"
      ],
      "assignee": "John Doe",
      "priority": "high"
    },
    {
      "id": "task-uuid-2",
      "subject": "Database migration",
      "criteria": "Migrate user data to new schema",
      "actionItems": [
        "Create migration scripts"
      ],
      "assignee": "Sarah Smith",
      "priority": "medium"
    }
  ],
  "projectKey": "PROJ",
  "issueType": "Task"
}
```

**Request Validation:**
- `tasks` (required): Array of task objects, minimum 1 task
- `tasks[].id` (required): Unique task identifier
- `tasks[].subject` (required): Task subject/title
- `projectKey` (required): Jira project key (uppercase letters only)
- `issueType` (required): Issue type name (e.g., "Task", "Story", "Bug")

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Tasks exported successfully",
  "results": {
    "task-uuid-1": {
      "issueKey": "PROJ-123",
      "url": "https://your-domain.atlassian.net/browse/PROJ-123",
      "success": true
    },
    "task-uuid-2": {
      "issueKey": "PROJ-124",
      "url": "https://your-domain.atlassian.net/browse/PROJ-124",
      "success": true
    }
  },
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

**Error Responses:**

- **400 Bad Request**: Validation error
```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "msg": "Tasks array is required and must not be empty",
        "param": "tasks",
        "location": "body"
      }
    ]
  }
}
```

- **401 Unauthorized**: Not authenticated
```json
{
  "error": {
    "message": "Not authenticated. Please connect to Jira first."
  }
}
```

- **500 Internal Server Error**: Export failed
```json
{
  "error": {
    "message": "Failed to export tasks to Jira"
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/jira/export \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "id": "abc-123",
        "subject": "Test task",
        "criteria": "Test criteria",
        "actionItems": ["Action 1"],
        "assignee": "John Doe",
        "priority": "high"
      }
    ],
    "projectKey": "PROJ",
    "issueType": "Task"
  }'
```

## Task Object Structure

Tasks used in export endpoints follow this structure:

```json
{
  "id": "unique-task-identifier",
  "subject": "Task title",
  "criteria": "Acceptance criteria or definition of done",
  "actionItems": [
    "Action item 1",
    "Action item 2"
  ],
  "assignee": "Person responsible (optional)",
  "priority": "high|medium|low"
}
```

**Field Descriptions:**
- `id`: Unique identifier (typically UUID) for the task
- `subject`: Clear, concise task title (required, max 255 characters)
- `criteria`: Acceptance criteria or definition of done (required)
- `actionItems`: Array of specific action items (required, at least one)
- `assignee`: Person responsible for the task (optional, can be empty string)
- `priority`: Task priority level - "high", "medium", or "low" (required)

## Error Codes

### HTTP Status Codes

- **200 OK**: Request successful
- **400 Bad Request**: Validation error or invalid request
- **401 Unauthorized**: Authentication required (for Jira endpoints)
- **404 Not Found**: Route not found
- **500 Internal Server Error**: Server error or external API failure

### Common Error Scenarios

1. **Validation Errors**: Check `error.details` array for specific field validation errors
2. **Authentication Errors**: Complete OAuth flow before accessing Jira endpoints
3. **Session Expired**: Re-authenticate if session expires (24 hours default)
4. **OpenAI API Errors**: Check OpenAI API key and quota
5. **Jira API Errors**: Verify OAuth permissions and project access

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production deployments.

## CORS Configuration

CORS is configured based on the `CORS_ORIGIN` environment variable:
- **Development**: `http://localhost:3000`
- **Production**: Your production frontend domain

## Session Management

- Sessions are stored server-side using `express-session`
- Default session expiration: 24 hours
- OAuth tokens are encrypted before storage
- Sessions are cookie-based with secure settings in production

## Examples

### Complete Workflow: Generate and Export Tasks

```bash
# 1. Generate tasks
curl -X POST http://localhost:5000/api/tasks/generate \
  -H "Content-Type: application/json" \
  -d '{
    "meetingMinutes": "Team meeting: Need to implement authentication and update database."
  }'

# 2. Initiate OAuth (get authorization URL)
curl http://localhost:5000/api/jira/oauth/authorize

# 3. User completes OAuth flow in browser, then callback is sent
curl -X POST http://localhost:5000/api/jira/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization-code",
    "state": "state-from-authorize"
  }'

# 4. Check authentication status
curl http://localhost:5000/api/jira/config/status

# 5. List available projects
curl http://localhost:5000/api/jira/projects

# 6. Get issue types for a project
curl http://localhost:5000/api/jira/issue-types/PROJ

# 7. Export tasks
curl -X POST http://localhost:5000/api/jira/export \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "id": "task-1",
        "subject": "Implement authentication",
        "criteria": "Users can log in",
        "actionItems": ["Set up middleware"],
        "assignee": "John Doe",
        "priority": "high"
      }
    ],
    "projectKey": "PROJ",
    "issueType": "Task"
  }'
```

## Additional Resources

- [JIRA_SETUP.md](JIRA_SETUP.md) - Jira integration setup guide
- [USER_GUIDE.md](USER_GUIDE.md) - Step-by-step user instructions
- [README.md](../README.md) - Project overview and setup
