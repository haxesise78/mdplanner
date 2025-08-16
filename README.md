# MD Planner

A modern task management system that uses markdown files as the database, built with Deno and TypeScript. MD Planner provides an intuitive web interface for managing tasks with support for kanban boards, lists, timelines, and advanced features like task dependencies and project configuration.

## Features

- **Markdown-Based Database**: All tasks and project configuration stored in a single markdown file
- **Multiple Views**:
  - Summary view with project overview and statistics
  - List view with drag-and-drop task organization
  - Kanban board view with customizable sections
  - Timeline view for project scheduling
  - Configuration management interface
- **Rich Task Management**:
  - Task creation, editing, and deletion
  - Subtask support with nested hierarchies
  - Task dependencies (blocked_by relationships)
  - Priority levels (1-5 scale)
  - Due dates and effort estimation
  - Tags and assignee management
  - Markdown description support
  - Miletone support
- **Dynamic Configuration**:
  - Customizable board sections
  - Project team members management
  - Tag system for categorization
  - Working days and project timeline settings
- **Dark Mode Support**: Complete dark theme implementation
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

## Screenshots

The `docs/screenshots/` directory contains visual examples of all major features including the board view, list view, task editing, configuration management, and timeline visualization.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues, questions, or feature requests, please create an issue in the project repository.
