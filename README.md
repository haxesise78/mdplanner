# MD Planner

A modern task management system that uses markdown files as the database, built with Deno and TypeScript. MD Planner provides an intuitive web interface for managing tasks with support for kanban boards, lists, timelines, and advanced features like task dependencies and project configuration.

## Features

- **Markdown-Based Database**: All tasks and project configuration stored in a single markdown file
- **Multiple Views**:
  - Summary view with project overview and statistics
  - List view with drag-and-drop task organization
  - Kanban board view with customizable sections
  - Timeline view for project scheduling
  - Notes section with tabbed note-taking interface
  - Goals tracking with enterprise and project goals
  - Canvas view for visual brainstorming with sticky notes
  - Mindmap view for hierarchical idea organization
  - Configuration management interface
- **Rich Task Management**:
  - Task creation, editing, and deletion
  - Subtask support with nested hierarchies
  - Task dependencies (blocked_by relationships)
  - Priority levels (1-5 scale)
  - Due dates and effort estimation
  - Tags and assignee management
  - Markdown description support
  - Milestone support
- **Notes Management**:
  - **Tabbed Interface**: Clean tab-based navigation for organizing multiple notes
  - **Horizontal Scrolling**: Automatic horizontal scroll when you have many note tabs
  - **Inline Editing**: Click-to-edit functionality with seamless view/edit mode switching
  - **Auto-Save**: Automatic saving with 1-second debounce to prevent data loss
  - **Markdown Support**: Full markdown rendering with proper dark mode styling
  - **Linear IDs**: Simple sequential IDs (note_1, note_2, etc.) for easy reference
  - **Real-time Updates**: Instant UI updates when creating, editing, or deleting notes
  - **Full CRUD Operations**: Create, read, update, and delete notes via REST API
- **Goals Tracking**:
  - **Dual Goal Types**: Support for both enterprise-level and project-specific goals
  - **KPI Tracking**: Define and monitor Key Performance Indicators for each goal
  - **Timeline Management**: Set start and end dates with visual date tracking
  - **Status Management**: Track progress with 6 status levels (planning, on-track, at-risk, late, success, failed)
  - **Advanced Filtering**: Filter goals by type (enterprise/project) and status with real-time UI updates
  - **Linear IDs**: Simple sequential IDs (goal_1, goal_2, etc.) for easy reference
  - **Rich Metadata**: Store detailed descriptions, success criteria, and progress notes
  - **Visual Status Indicators**: Color-coded status badges and type labels
- **Canvas & Mindmap Views**:
  - **Canvas**: Visual brainstorming with draggable sticky notes
  - **Mindmap**: Hierarchical idea organization with tree and circular layouts
  - **Interactive Elements**: Drag, resize, and color-code visual elements
  - **Export Support**: CSV export for both canvas and mindmap data
- **Import/Export System**:
  - **CSV Import**: Import tasks from CSV files with full metadata support
  - **CSV Export**: Export tasks, canvas sticky notes, and mindmaps to CSV
  - **PDF Reports**: Generate single-page project reports for printing/sharing
  - **Data Safety**: Smart duplicate prevention and data integrity protection
  - **Batch Operations**: Import multiple tasks while preserving existing data
- **Dynamic Configuration**:
  - Customizable board sections
  - Project team members management
  - Tag system for categorization
  - Working days and project timeline settings
- **Advanced UI Features**:
  - **Responsive Design**: Optimized for desktop devices
  - **Compact Navigation**: Space-efficient navbar that fits standard screens
  - **Dark Mode Support**: Complete dark theme with automatic system detection
  - **Search Functionality**: Real-time task search across all views
  - **Keyboard Shortcuts**: Efficient navigation and task management
- **Drag & Drop**: Intuitive task movement between sections and reordering

## Quick Start

### Prerequisites

- [Deno](https://deno.land/) installed on your system

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Start the development server:

```bash
deno task dev
```

4. Open your browser and navigate to `http://localhost:8003`

### Using a Custom Markdown File

You can specify any markdown file to use as your task database:

```bash
deno task dev my-project.md
```

or for production:

```bash
deno task start my-project.md
```

### Example with Demo File

```bash
deno task dev docs/structure.md
```

## Import/Export Guide

MD Planner provides comprehensive import/export functionality for data portability and backup.

### CSV Import/Export

#### Accessing Import/Export Features

**Desktop Interface:**
1. Click the import/export icon (⬇⬆) in the top navigation bar
2. Select from dropdown options:
   - **Export Tasks CSV**: Download current tasks as CSV
   - **Import Tasks CSV**: Upload CSV file to import tasks
   - **Export PDF Report**: Generate printable project report

#### CSV Format Specification

The CSV format supports all task metadata and follows this structure:

```csv
ID,Title,Section,Completed,Priority,Assignee,Due Date,Effort,Tags,Blocked By,Milestone,Description
task1,Setup Development Environment,Todo,FALSE,1,Alice Smith,2025-08-20,2,"Backend, Infrastructure","","Sprint 1","Install and configure development tools"
task2,Design UI Mockups,In Progress,FALSE,2,Bob Johnson,2025-08-22,3,"Frontend, Design","task1","Sprint 1","Create wireframes and mockups"
task3,Database Schema,Done,TRUE,1,Alice Smith,2025-08-18,1,"Backend, Database","","Sprint 1","Define database structure"
```

**Field Descriptions:**
- **ID**: Unique identifier (will be shown as `(task1)` in markdown)
- **Title**: Task name/title
- **Section**: Board section (`Todo`, `In Progress`, `Done`, or custom sections)
- **Completed**: `TRUE` or `FALSE`
- **Priority**: Number 1-5 (1 = highest priority)
- **Assignee**: Team member name (must match configured assignees)
- **Due Date**: ISO date format `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`
- **Effort**: Estimated effort in days (integer)
- **Tags**: Comma-separated list in quotes (e.g., `"Frontend, UI, Bug"`)
- **Blocked By**: Comma-separated task IDs in quotes (e.g., `"task1, task2"`)
- **Milestone**: Milestone name/identifier
- **Description**: Detailed task description

#### Import Process

1. **Prepare CSV File**: Create or export tasks using the format above
2. **Import via UI**:
   - Desktop: Click import/export icon → "Import Tasks CSV"
3. **File Selection**: Choose your CSV file
4. **Smart Processing**:
   - Validates CSV format and data
   - Checks for duplicate tasks (by title)
   - Preserves existing tasks and data
   - Safely appends new tasks to Todo section
5. **Confirmation**: Shows number of tasks imported
6. **Auto-Refresh**: UI automatically updates to show new tasks

#### Export Features

**Tasks CSV Export:**
- Exports all tasks with complete metadata
- Includes custom task configurations and descriptions
- Preserves task IDs, priorities, assignments, and dependencies
- Compatible format for re-importing or external analysis

**PDF Report Export:**
- Generates single-page project overview
- Includes project statistics and task breakdown
- Section-wise progress visualization
- Goals and milestone tracking
- Optimized for printing and sharing
- Opens in new window for easy printing/saving

#### Data Safety Features

- **Duplicate Prevention**: Automatically detects existing tasks by title
- **Non-Destructive Import**: Preserves all existing tasks, notes, goals, and configuration
- **Data Validation**: Validates CSV format and required fields
- **Error Handling**: Clear error messages for invalid data
- **Backup Recommendation**: Always export before major imports

#### Common Use Cases

1. **Project Migration**: Export from one project, import to another
2. **Bulk Task Creation**: Create many tasks in spreadsheet, import all at once
3. **Data Backup**: Regular CSV exports for backup purposes
4. **Team Collaboration**: Share task lists between team members
5. **External Analysis**: Export for reporting or analysis in other tools
6. **Project Reporting**: Generate PDF reports for stakeholders

#### Canvas & Mindmap Export

While import is currently available for tasks only, you can export:
- **Canvas Data**: Sticky notes with positions, colors, and content
- **Mindmap Data**: Hierarchical node structures and relationships
- Access via API endpoints: `/api/export/csv/canvas` and `/api/export/csv/mindmaps`

## Project Structure

```
mdplanner/
├── main.ts                    # Server entry point
├── deno.json                  # Deno configuration and tasks
├── src/
│   ├── api/
│   │   └── tasks.ts          # REST API endpoints
│   ├── lib/
│   │   └── markdown-parser.ts # Markdown parsing logic
│   └── static/
│       ├── index.html        # Main UI interface
│       └── app.js           # Frontend JavaScript
├── docs/
│   ├── structure.md          # Example markdown task file
│   └── screenshots/          # Application screenshots
└── README.md
```

## Markdown File Format

MD Planner uses a specific markdown format to store tasks and configuration:

### Basic Structure

```markdown
# Project Name

Project description goes here...

<!-- Configurations -->
# Configurations

Start Date: 2024-01-15
Working Days: 5

Assignees:
- Alice Smith
- Bob Johnson

Tags:
- Bug
- Feature
- Enhancement

<!-- Notes -->
# Notes

## Project Setup Notes

<!-- id: note_1 -->
These are notes about setting up the project environment.
Key points to remember:
- Use Deno for the backend
- TailwindCSS for styling

## Meeting Notes - Aug 16

<!-- id: note_2 -->
Discussed the new features:
- Notes section with tabs
- Goals tracking with KPIs

# Headers in Notes Work Now!
You can use any level of headers within note content.

<!-- Goals -->
# Goals

## Increase User Engagement {type: enterprise; kpi: 25% increase in daily active users; start: 2025-01-01; end: 2025-12-31; status: on-track}

<!-- id: goal_1 -->
Focus on improving user experience and adding new features that keep users engaged with the platform.

## Complete MVP Release {type: project; kpi: All core features implemented; start: 2025-08-01; end: 2025-10-31; status: on-track}

<!-- id: goal_2 -->
Release the minimum viable product with task management, notes, and goals functionality.

<!-- Board -->
# Board

## Ideas

- [ ] (task-1) Task title here {tag: [Bug]; priority: 1; assignee: Alice}
  - Additional description for the task
  - Can span multiple lines

## Todo

- [ ] (task-2) Another task {due_date: 2024-01-20; effort: 3}
  - [ ] (subtask-1) Subtask example
  - [ ] (subtask-2) Another subtask

## In Progress

- [x] (task-3) Completed task {tag: [Feature]; assignee: Bob}

## Done

- [x] (task-4) Done task with dependencies {blocked_by: [task-1, task-2]}
```

### Task Configuration Options

Tasks can include configuration within `{}` brackets:

- **tag**: `[Bug, Feature]` - Array of tags
- **due_date**: `2024-01-20T14:30` - Due date/time
- **assignee**: `Alice Smith` - Assigned team member
- **priority**: `1-5` - Priority level (1 = highest, 5 = lowest)
- **effort**: `3` - Estimated effort in days
- **blocked_by**: `[task-1, task-2]` - Dependencies (task IDs)

### Notes Configuration

Notes are stored under the `# Notes` section with each note as a level 2 heading:

```markdown
## Note Title

<!-- id: note_1 -->
Note content goes here...
Can include markdown formatting, lists, and rich text.
```

**Note Features:**
- **Linear IDs**: Sequential numbering (note_1, note_2, note_3, etc.)
- **Markdown Content**: Full markdown support with proper rendering
- **Auto-Save**: Changes saved automatically with 1-second debounce
- **Inline Editing**: Click title or content to edit directly
- **Tab Navigation**: Easy switching between multiple notes
- **Horizontal Scroll**: Tabs scroll horizontally when too many to fit

**Note Content Features:**
- **Full Header Support**: Safely use `# Header` and `## Header` within note content without breaking document structure
- **Advanced Markdown Support**: Complete markdown formatting including lists, code blocks, emphasis, and nested headers
- **Intelligent Parsing**: Smart detection prevents content headers from being mistaken for new note boundaries
- **Leak-Proof Architecture**: Robust boundary system ensures note content never spills into other sections
- **Auto-Generated Boundaries**: System automatically maintains section separators during file operations
- **Content Freedom**: Write complex, multi-level content without parsing restrictions

### Goals Configuration

Goals are stored under the `# Goals` section with metadata in the heading:

```markdown
## Goal Title {type: enterprise; kpi: Success metric; start: 2025-01-01; end: 2025-12-31; status: on-track}

<!-- id: goal_1 -->
Goal description and details go here.
```

**Goal Features:**
- **Linear IDs**: Sequential numbering (goal_1, goal_2, goal_3, etc.)
- **Dual Types**: Enterprise (company-wide) and Project (specific initiative) goals
- **Status Tracking**: 6 comprehensive status levels for precise progress monitoring
- **KPI Integration**: Define measurable success criteria
- **Timeline Management**: Track start/end dates with visual indicators
- **Advanced Filtering**: Real-time filtering by type and status
- **Rich Descriptions**: Support for detailed goal documentation

Goal configuration options:
- **type**: `enterprise` or `project` - Goal classification
- **kpi**: Success measurement criteria (e.g., "25% increase in revenue", "100% test coverage")
- **start**: Start date in YYYY-MM-DD format
- **end**: End date in YYYY-MM-DD format
- **status**: `planning`, `on-track`, `at-risk`, `late`, `success`, or `failed`

### Canvas Configuration

The Canvas view provides visual brainstorming capabilities with draggable sticky notes:

```markdown
<!-- Canvas -->
# Canvas

## Risk Analysis {color: pink; position: {x: 790, y: 90}}

<!-- id: sticky_note_1 -->

## Meeting Notes {color: yellow; position: {x: 200, y: 150}; size: {width: 250, height: 180}}

<!-- id: sticky_note_2 -->
```

**Canvas Features:**
- **Interactive Sticky Notes**: Drag and drop to reposition
- **Color Coding**: Different colors for categorization
- **Resizable**: Adjust size for content needs
- **Auto-Save**: Position and content changes saved automatically
- **Export Support**: CSV export for backup and sharing

Sticky note configuration options:
- **color**: `yellow`, `pink`, `green`, `blue`, `purple`, `orange` - Visual categorization
- **position**: `{x: number, y: number}` - Canvas coordinates
- **size**: `{width: number, height: number}` - Dimensions (optional, defaults to 200x150)

### Mindmap Configuration

The Mindmap view enables hierarchical idea organization:

```markdown
<!-- Mindmap -->
# Mindmap

## Project Structure

<!-- id: mindmap_1 -->

- Backend
  - API Design
    - REST Endpoints
    - Authentication
  - Database
    - Schema Design
    - Data Migration
- Frontend
  - User Interface
    - Component Library
    - Responsive Design
  - User Experience
    - Workflow Design
    - Accessibility
```

**Mindmap Features:**
- **Hierarchical Structure**: Nested bullet points create mind map nodes
- **Multiple Layouts**: Tree and circular layout options
- **Interactive Navigation**: Click and drag to explore large maps
- **Zoom Controls**: Scale view for detailed or overview perspectives
- **Export Support**: CSV export for external tools

## Development

### Available Commands

```bash
# Start development server with hot reload
deno task dev

# Start production server
deno task start

# Start with custom markdown file
deno task dev my-tasks.md
```

### Key Technologies

- **Backend**: Deno + TypeScript
- **Frontend**: Vanilla JavaScript + TailwindCSS
- **Storage**: Markdown files (no external database required)
- **API**: REST endpoints with CORS support

## Configuration Management

All project configuration is stored within the markdown file itself under the `# Configurations` section:

- **Start Date**: Project start date for timeline calculations
- **Working Days**: Working days per week (5, 6, or 7)
- **Assignees**: Team members list
- **Tags**: Available tags for categorization

## Features in Detail

### Timeline View

Generates project schedules based on:
- Task effort estimates (in days)
- Task dependencies (blocked_by relationships)
- Project start date and working days configuration
- Automatic scheduling with dependency resolution
- Due date verification

### Drag & Drop

- Move tasks between board sections
- Reorder tasks within sections

### Dark Mode

Complete dark theme support with:
- Automatic detection of system preference
- Manual toggle option
- Consistent styling across all views and components

### Notes & Goals Technical Details

**Linear ID System:**
- Sequential numbering for both notes (note_1, note_2) and goals (goal_1, goal_2)
- Frontend uses array indices for UI navigation
- Backend API uses stored IDs for data operations
- Automatic ID generation based on existing highest ID

**Markdown Parsing Rules:**
- **Section Boundary Comments**: Use HTML comments to mark section boundaries:
  - `<!-- Configurations -->` - Marks start of configuration section
  - `<!-- Notes -->` - Marks start of notes section
  - `<!-- Goals -->` - Marks start of goals section
  - `<!-- Canvas -->` - Marks start of goals section
  - `<!-- Mindmap -->` - Marks start of goals section
  - `<!-- Board -->` - Marks start of board section
- **Smart Note Detection**: Parser distinguishes between note titles and content headers using look-ahead logic
- **Header Support**: You can now safely use `#` and `##` headers within note content without breaking parsing
- **Automatic Boundary Preservation**: System automatically maintains section boundaries when saving content

**Advanced Parsing Features:**
- **Look-Ahead Detection**: When encountering `## Header`, parser checks for `<!-- id: note_X -->` comment to determine if it's a new note or content
- **Content Leak Prevention**: HTML comment boundaries prevent note content from spilling into other sections
- **Robust Section Separation**: Even complex note content with multiple headers stays properly contained
- **Auto-Generated Comments**: System automatically adds boundary comments when regenerating files

**Auto-Save Implementation:**
- 1-second debounce timer to prevent excessive saves
- Real-time content synchronization with backend
- Graceful error handling and retry logic
- Preserves content integrity during editing sessions
- **Boundary Comment Preservation**: Auto-save maintains all section boundary comments to prevent content leakage

**REST API Endpoints:**
```
# Tasks
GET    /api/tasks              # Retrieve all tasks
GET    /api/tasks/:id          # Retrieve specific task
POST   /api/tasks              # Create new task
PUT    /api/tasks/:id          # Update existing task
DELETE /api/tasks/:id          # Delete task
PATCH  /api/tasks/:id/move     # Move task to different section

# Import/Export
GET    /api/export/csv/tasks   # Export tasks as CSV
POST   /api/import/csv/tasks   # Import tasks from CSV (Content-Type: text/plain)
GET    /api/export/csv/canvas  # Export canvas sticky notes as CSV
POST   /api/import/csv/canvas  # Import canvas sticky notes from CSV
GET    /api/export/csv/mindmaps # Export mindmaps as CSV
GET    /api/export/pdf/report  # Generate PDF project report

# Project Management
GET    /api/project            # Retrieve project info (name, description, notes, goals)
GET    /api/project/config     # Retrieve project configuration
POST   /api/project/config     # Update project configuration
GET    /api/project/sections   # Retrieve board sections
POST   /api/project/rewrite    # Rewrite tasks with custom sections

# Notes
GET    /api/notes              # Retrieve all notes
GET    /api/notes/:id          # Retrieve specific note
POST   /api/notes              # Create new note
PUT    /api/notes/:id          # Update existing note
DELETE /api/notes/:id          # Delete note

# Goals
GET    /api/goals              # Retrieve all goals
GET    /api/goals/:id          # Retrieve specific goal
POST   /api/goals              # Create new goal
PUT    /api/goals/:id          # Update existing goal
DELETE /api/goals/:id          # Delete goal

# Canvas
GET    /api/canvas             # Retrieve all canvas sticky notes
POST   /api/canvas             # Create new sticky note
PUT    /api/canvas/:id         # Update existing sticky note
DELETE /api/canvas/:id         # Delete sticky note

# Mindmaps
GET    /api/mindmaps           # Retrieve all mindmaps
POST   /api/mindmaps           # Create new mindmap
PUT    /api/mindmaps/:id       # Update existing mindmap
DELETE /api/mindmaps/:id       # Delete mindmap
```

**UI Features:**
- Tabbed interface with horizontal scrolling overflow
- Inline editing with seamless view/edit mode transitions
- Real-time filtering and search capabilities
- Responsive design with dark mode consistency
- Visual status indicators and type badges

## Troubleshooting

### Content Leaking Between Sections

If you notice note content appearing in other sections or parsing issues:

1. **Check Boundary Comments**: Ensure all major sections have their boundary comments:
   ```markdown
   <!-- Configurations -->
   # Configurations

   <!-- Notes -->
   # Notes

   <!-- Goals -->
   # Goals

   <!-- Board -->
   # Board
   ```

2. **Auto-Regeneration**: The system automatically adds missing boundary comments when saving, but manual editing might remove them.

3. **Note ID Format**: Ensure note IDs follow the pattern `<!-- id: note_\d+ -->` (e.g., `<!-- id: note_1 -->`)

### Parser Behavior

- **Headers in Content**: `# Header` and `## Header` within note content are now fully supported
- **Smart Detection**: Parser uses look-ahead to distinguish between note titles and content headers
- **Boundary Preservation**: All file operations maintain section boundary integrity

### Import/Export Issues

**CSV Import Not Working:**
1. **File Format**: Ensure CSV has proper headers and format (see Import/Export Guide above)
2. **Encoding**: Use UTF-8 encoding for CSV files
3. **Field Validation**: Check that assignees exist in project configuration
4. **Duplicate Detection**: If no tasks imported, they may already exist (checked by title)

**Data Not Appearing After Import:**
1. **Refresh Browser**: Force refresh (Ctrl+F5 or Cmd+Shift+R) to reload latest data
2. **Check Section**: Imported tasks appear in "Todo" section by default
3. **View Selection**: Ensure you're in Board or List view to see tasks

**CSV Export Issues:**
1. **Empty Export**: Verify tasks exist in the project
2. **Browser Blocks**: Check browser downloads/popup settings
3. **File Permissions**: Ensure browser can write to Downloads folder

**PDF Report Problems:**
1. **Popup Blocked**: Allow popups for the application domain
2. **Print Preview**: PDF opens in new window - use browser's print function
3. **Layout Issues**: Report optimized for single page - complex projects may need scrolling

## Quick Reference

### Essential Commands
```bash
# Start development server
deno task dev

# Start with custom file
deno task dev my-project.md

# Start production server
deno task start
```

### Key Shortcuts & UI Access

**Desktop Navigation:**
- **Import/Export**: Click ⬇⬆ icon → Select option
- **Add Task**: Click "+ Task" button
- **Dark Mode**: Click moon/sun icon
- **Search**: Use search box in header
- **Views**: Click Summary/List/Board/Timeline/Notes/Goals/Canvas/Mindmap/Config

### File Format Quick Reference
```markdown
# Project Name

Description here...

<!-- Configurations -->
# Configurations
Start Date: 2025-01-01
Assignees:
- Alice Smith
Tags:
- Bug

<!-- Board -->
# Board
## Todo
- [ ] (task1) Task Title {tag: [Bug]; priority: 1; assignee: Alice; due_date: 2025-01-20}
  Task description here
```

### CSV Import Format
```csv
ID,Title,Section,Completed,Priority,Assignee,Due Date,Effort,Tags,Blocked By,Milestone,Description
task1,Setup Environment,Todo,FALSE,1,Alice,2025-01-20,2,"Backend","","Sprint 1","Setup dev tools"
```

### API Quick Reference
- **Tasks**: `/api/tasks` (GET, POST, PUT, DELETE)
- **Export CSV**: `/api/export/csv/tasks`
- **Import CSV**: `POST /api/import/csv/tasks` (Content-Type: text/plain)
- **PDF Report**: `/api/export/pdf/report`
- **Project Info**: `/api/project`

## Screenshots

The `docs/screenshots/` directory contains visual examples of all major features including the board view, list view, task editing, configuration management, timeline visualization, import/export functionality, and canvas/mindmap views.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly with import/export functionality
5. Update documentation if adding new features
6. Submit a pull request

## Support

For issues, questions, or feature requests, please create an issue in the project repository. When reporting import/export issues, please include:
- CSV file format/sample data
- Browser type and version
- Error messages (if any)
- Steps to reproduce
