# Demo Structure

A Markdown-Based Task & Project Management Tool

This project aims to create a lightweight yet flexible task tracking system, where all task details and configurations are written directly in Markdown with curly-brace `{}` configurations.

---














# Configurations

Start Date: 2025-08-12
Working Days: 7

Assignees:
- Alice
- Bob
- Charlie

Tags:
- Bug
- Enhancement
- Documentation
- Research

# Board

## Ideas

- [ ] (task_001) Implement AI-based task suggestions {tag: [Research]; due_date: 2025-08-20; assignee: Alice; priority: 1; effort: 5}
  - The idea is to have the system scan existing tasks and suggest possible next steps or dependencies automatically.
  - [ ] (task_002) Research existing AI task recommendation algorithms {due_date: 2025-08-26T22}
  - [ ] (task_003) Draft architecture document for AI suggestion engine {due_date: 2025-08-19T22; effort: 1; blocked_by: [task_004]}
- [ ] (task_004) Allow tasks to have color-coded priorities {tag: [Enhancement]; due_date: 2025-08-29T22; assignee: Bob; priority: 3; effort: 6; blocked_by: [task_001]; milestone: M2}
  - Each priority level would have a configurable color in the UI for quick visual scanning.

## Todo

- [ ] (task_005) Create export-to-CSV feature {tag: [Enhancement]; due_date: 2025-08-21T22; assignee: Charlie; priority: 2; effort: 3}
- [ ] (task_006) Implement "blocked_by" logic in backend {due_date: 2025-08-14T22; effort: 4; blocked_by: [task_003]}

## In Progress

- [x] (task_007) Fix login redirect bug {tag: [Bug]; due_date: 2025-08-17T10; assignee: Alice; priority: 1; effort: 1}
  The login page was looping back to itself after entering credentials — resolved by fixing the token validation middleware.
- [ ] (task_008) Create interactive Gantt chart {due_date: 2025-09-04T22:28; effort: 6; blocked_by: [task_005, task_006]}

## Done

- [x] (task_009) Write onboarding documentation {tag: [Documentation]; assignee: Charlie; priority: 4; effort: 2}
- [x] (task_010) Add dark mode toggle {tag: [Enhancement]; assignee: Bob; priority: 3; effort: 1}

## Test

- [ ] (task_1755308676056_jrevi1j8e) test add task button {tag: [Enhancement]; due_date: 2025-08-15T21; assignee: Bob; priority: 1; effort: 1; milestone: M1}
  Testing creating new task

## In Design

- [ ] (task_011) Mobile app wireframes {tag: [Research]; assignee: Alice; priority: 2; effort: 5}

## will it work this time

- [ ] (1) testing linear ids {tag: [Bug]; due_date: 2025-08-19T22; assignee: Charlie; priority: 5; effort: 1; milestone: M3}
- [ ] (2) second task {tag: [Bug]; due_date: 2025-08-22T22; assignee: Bob; priority: 3; effort: 2; blocked_by: [1]; milestone: M3}

