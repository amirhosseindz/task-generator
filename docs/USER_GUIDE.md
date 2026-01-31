# User Guide

This guide provides step-by-step instructions for using the Task Generator application, including task generation, editing, and Jira export.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Generating Tasks](#generating-tasks)
3. [Editing Tasks](#editing-tasks)
4. [Managing Tasks](#managing-tasks)
5. [Exporting to Jira](#exporting-to-jira)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the Application

1. **Start the Application**
   - If running locally, navigate to `http://localhost:3000`
   - If using production, navigate to your production URL

2. **Initial Setup**
   - Ensure the backend is running and accessible
   - The application will display a form for entering meeting minutes

## Generating Tasks

### Step 1: Enter Meeting Minutes

1. **Paste or Type Meeting Minutes**
   - In the text area, paste or type the meeting minutes you want to extract tasks from
   - Minimum length: 10 characters
   - The text can include:
     - Meeting notes
     - Action items
     - Decisions made
     - Discussion points

2. **Example Meeting Minutes:**
   ```
   Team Meeting - January 15, 2024
   
   Discussion:
   - Need to implement user authentication
   - Database migration required
   - API documentation needs updating
   
   Action Items:
   - John: Set up authentication middleware by end of week
   - Sarah: Create migration scripts for database
   - Mike: Update API docs with new endpoints
   ```

### Step 2: Generate Tasks

1. **Click "Generate Tasks"**
   - The button is located below the meeting minutes text area
   - A loading spinner will appear while processing

2. **Wait for Results**
   - The AI will analyze the meeting minutes
   - Tasks will appear in cards below the input area
   - Each task includes:
     - **Subject**: Task title
     - **Criteria**: Acceptance criteria
     - **Action Items**: Specific steps to complete
     - **Assignee**: Person responsible
     - **Priority**: High, Medium, or Low

3. **Review Generated Tasks**
   - Review each task for accuracy
   - Tasks can be edited, deleted, or exported

## Editing Tasks

### Entering Edit Mode

1. **Click the "Edit" Button**
   - Located on the top-right of each task card
   - The task card will expand into edit mode

### Editing Task Fields

1. **Subject** (Required)
   - Click the subject field to edit
   - Maximum 255 characters
   - Should be a clear, concise task title

2. **Criteria** (Required)
   - Click the criteria text area to edit
   - Describe the acceptance criteria or definition of done
   - Can be multiple lines

3. **Action Items**
   - **Add Action Item**: Click "Add Action Item" button
   - **Edit Action Item**: Click the text field to edit
   - **Remove Action Item**: Click the "×" button next to an item
   - Action items are displayed as a list

4. **Assignee** (Optional)
   - Click the assignee field to edit
   - Enter the name or email of the person responsible
   - Leave empty for unassigned tasks

5. **Priority** (Required)
   - Use the dropdown to select:
     - **High**: Urgent or critical tasks
     - **Medium**: Normal priority tasks
     - **Low**: Nice-to-have or low-priority tasks

### Saving Changes

1. **Click "Save"**
   - Validates all fields
   - Saves changes to the task
   - Exits edit mode

2. **Click "Cancel"**
   - Discards all changes
   - Returns to view mode
   - Original task data is restored

### Validation

- **Subject** must not be empty
- **Criteria** must not be empty
- **Priority** must be selected
- If validation fails, error messages will be displayed

## Managing Tasks

### Adding New Tasks

1. **Click "Add New Task"**
   - Located above the task list
   - A new empty task card appears in edit mode

2. **Fill in Task Details**
   - Enter subject, criteria, action items, assignee, and priority
   - Follow the same editing process as above

3. **Save the Task**
   - Click "Save" to add the task to your list

### Deleting Tasks

#### Single Task Deletion

1. **Click "Delete" Button**
   - Located on the task card (in view or edit mode)
   - A confirmation dialog appears

2. **Confirm Deletion**
   - Click "Confirm" to delete
   - Click "Cancel" to keep the task

#### Bulk Deletion

1. **Select Tasks**
   - Check the checkbox on each task card you want to delete
   - Or use "Select All" to select all tasks

2. **Click "Delete Selected"**
   - Located in the task list header
   - A confirmation dialog appears

3. **Confirm Deletion**
   - Click "Confirm" to delete all selected tasks
   - Click "Cancel" to keep the tasks

### Task Selection

1. **Select Individual Tasks**
   - Check the checkbox on each task card
   - Selected tasks are highlighted

2. **Select All Tasks**
   - Click "Select All" button
   - All tasks are selected

3. **Deselect All Tasks**
   - Click "Deselect All" button
   - All selections are cleared

## Exporting to Jira

### Prerequisites

- Jira integration must be configured (see [JIRA_SETUP.md](JIRA_SETUP.md))
- You must have access to a Jira site
- OAuth authentication is required

### Step 1: Connect to Jira

1. **Check Connection Status**
   - Look for the connection status badge in the header
   - Shows "Not connected" if not authenticated

2. **Click "Connect to Jira"**
   - Opens OAuth popup window
   - If popup is blocked, allow popups for this site

3. **Authorize the Application**
   - Log in to your Atlassian account (if not already logged in)
   - Select the Jira site you want to connect to
   - Review the requested permissions
   - Click "Authorize" or "Allow"

4. **Verify Connection**
   - The popup window will close automatically
   - Connection status should show "Connected"
   - You're now ready to export tasks

### Step 2: Select Tasks to Export

1. **Select Tasks**
   - Check the checkbox on each task you want to export
   - Or use "Select All" to export all tasks
   - Selected tasks are highlighted

2. **Verify Selection**
   - Ensure all tasks you want to export are selected
   - You can deselect tasks by unchecking them

### Step 3: Initiate Export

1. **Click Export Button**
   - **"Export Selected to Jira"**: Exports only selected tasks
   - **"Export All to Jira"**: Exports all tasks (ignores selection)

2. **Select Jira Project**
   - A dropdown appears with available projects
   - Select the project where you want to create issues
   - Projects are loaded from your Jira site

3. **Select Issue Type**
   - After selecting a project, choose the issue type:
     - **Task**: General task
     - **Story**: User story
     - **Bug**: Bug report
     - **Epic**: Epic or large feature
     - Other types available in your project

4. **Review Task Preview**
   - Review the tasks that will be exported
   - Verify project and issue type selection

5. **Confirm Export**
   - Click "Confirm Export"
   - A progress modal appears

### Step 4: Monitor Export Progress

1. **Progress Indicator**
   - Shows export status for each task
   - Tasks are processed one by one

2. **Export Results**
   - **Success**: Task shows with Jira issue key (e.g., "PROJ-123")
   - **Failed**: Task shows error message
   - Click issue keys to open tasks in Jira

3. **Close Modal**
   - Click "Close" when export is complete
   - Review exported tasks in the task list

### Step 5: Track Exported Tasks

1. **Export Status Badge**
   - Exported tasks display a badge with the Jira issue key
   - Badge color indicates export status:
     - **Green**: Successfully exported
     - **Red**: Export failed

2. **Open in Jira**
   - Click the issue key badge
   - Opens the issue in Jira in a new tab

3. **Re-export Failed Tasks**
   - If a task fails to export, you can try again
   - Select the failed task and export again
   - Check error messages for troubleshooting

### Disconnecting from Jira

1. **Click Connection Status Badge**
   - Located in the header
   - Shows "Connected" when authenticated

2. **Click "Disconnect"**
   - Clears OAuth tokens from session
   - Connection status shows "Not connected"
   - You'll need to reconnect before exporting again

## Troubleshooting

### Task Generation Issues

**Problem**: No tasks generated or error message appears

**Solutions**:
- Ensure meeting minutes text is at least 10 characters
- Check that backend is running and accessible
- Verify OpenAI API key is configured
- Try with different meeting minutes text

**Problem**: Tasks are inaccurate or incomplete

**Solutions**:
- Provide more detailed meeting minutes
- Include clear action items in the text
- Edit tasks after generation to correct them

### Task Editing Issues

**Problem**: Cannot save task changes

**Solutions**:
- Ensure all required fields are filled (subject, criteria, priority)
- Check for validation error messages
- Try refreshing the page and editing again

**Problem**: Changes are lost

**Solutions**:
- Always click "Save" before navigating away
- Don't close the browser tab while editing
- Changes are stored in browser memory (not persisted to server)

### Jira Export Issues

**Problem**: "Not connected" error when trying to export

**Solutions**:
- Click "Connect to Jira" and complete OAuth flow
- Check that popup blockers are disabled
- Verify OAuth configuration in backend

**Problem**: "No projects available" error

**Solutions**:
- Ensure you have access to at least one Jira project
- Verify OAuth app has correct scopes
- Try disconnecting and reconnecting

**Problem**: Export fails for some tasks

**Solutions**:
- Check error message in export results
- Verify project and issue type are valid
- Ensure you have permission to create issues in the project
- Try exporting tasks individually to identify problematic tasks

**Problem**: OAuth popup doesn't open

**Solutions**:
- Allow popups for the application domain
- Check browser popup blocker settings
- Try a different browser
- Manually open the authorization URL (check browser console)

### General Issues

**Problem**: Application doesn't load

**Solutions**:
- Check that both frontend and backend are running
- Verify backend API URL is correct
- Check browser console for errors
- Try refreshing the page

**Problem**: Tasks disappear after page refresh

**Solutions**:
- This is expected behavior - tasks are stored in browser memory
- Export tasks to Jira to persist them
- Copy task data before refreshing if needed

## Tips and Best Practices

1. **Meeting Minutes Format**
   - Use clear, structured text
   - Include action items explicitly
   - Mention assignees when possible
   - Separate different topics with line breaks

2. **Task Editing**
   - Review all generated tasks before exporting
   - Add missing details or correct inaccuracies
   - Set appropriate priorities
   - Assign tasks to team members

3. **Jira Export**
   - Export tasks in batches to related projects
   - Use appropriate issue types for your workflow
   - Review exported tasks in Jira after export
   - Keep connection active during export sessions

4. **Task Management**
   - Delete tasks that are not needed
   - Use bulk operations for efficiency
   - Select tasks carefully before bulk operations

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [JIRA_SETUP.md](JIRA_SETUP.md) for Jira configuration
3. Check application logs for error messages
4. Open an issue on the GitHub repository
