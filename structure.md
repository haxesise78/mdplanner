# MD Planner

Markdown powered task manager tool.

<!-- Configurations -->
# Configurations

Start Date: 2025-08-17
Working Days: 7

Assignees:
- Alice
- Bob
- Jane Doe
- John Doe

Tags:
- Backend
- Bug
- Database
- Frontend
- Infrastructure

<!-- Notes -->
# Notes

## 2025-08-17

<!-- id: note_1 -->
# My Title

Some random text

Some random text

My new paragraph

Using the simple view, it should work without problem right ?

# Custom Components

<!-- Custom Sections Metadata:
[
  {
    "id": "section_1755486375590_dxi0nyxmb",
    "type": "tabs",
    "title": "Tab View",
    "order": 0,
    "config": {
      "tabs": [
        {
          "id": "tab_1755486375590_tvxfnvo8k",
          "title": "Tab 1",
          "content": [
            {
              "id": "para_1755486392907_x4hqj14dn",
              "type": "text",
              "content": "Some text ? \nmultiline support ?\nkeep the return line !!\n"
            }
          ]
        },
        {
          "id": "tab_1755486375590_bukrcgivk",
          "title": "Tab 2",
          "content": [
            {
              "id": "para_1755486773502_uotg5kd30",
              "type": "code",
              "content": "// Enter your code here\n\necho \"Hello World\"",
              "language": "javascript"
            }
          ]
        },
        {
          "id": "tab_1755487132841_awji404ns",
          "title": "Last Tab",
          "content": []
        }
      ]
    }
  },
  {
    "id": "section_1755487235621_gx9cxjhw3",
    "type": "timeline",
    "title": "Timeline test 1",
    "order": 2,
    "config": {
      "timeline": [
        {
          "id": "timeline_1755487235621_onv9acnb9",
          "title": "Initial Step",
          "status": "success",
          "date": "2025-08-18",
          "content": [
            {
              "id": "para_1755487240358_f7o4b4ono",
              "type": "text",
              "content": "This is the first step"
            }
          ]
        },
        {
          "id": "timeline_1755487254126_l7m09sunh",
          "title": "Command #1",
          "status": "failed",
          "date": "2025-08-18",
          "content": [
            {
              "id": "para_1755487257749_gj8j6tniv",
              "type": "code",
              "content": "echo \"hello world\"",
              "language": "javascript"
            },
            {
              "id": "para_1755487282171_7r9py0dn4",
              "type": "code",
              "content": "echo \"Bonjour Monde\"",
              "language": "javascript"
            }
          ]
        }
      ]
    }
  },
  {
    "id": "section_1755487365362_rjt9ac5rr",
    "type": "split-view",
    "title": "Many Views",
    "order": 3,
    "config": {
      "splitView": {
        "columns": [
          [
            {
              "id": "para_1755487368292_f0q5pbco3",
              "type": "text",
              "content": "First Column"
            }
          ],
          [
            {
              "id": "para_1755487373993_63gf2kpy2",
              "type": "code",
              "content": "echo \"I am a column\"",
              "language": "javascript"
            }
          ]
        ]
      }
    }
  }
]
-->

<!-- Goals -->
# Goals

## 100 MAU {type: project; kpi: onboard 100 MAU; start: 2025-08-17; end: 2026-01-01; status: planning}

<!-- id: goal_1 -->

## Maintenance plan and new release weekly {type: enterprise; kpi: Release every weeks; start: 2025-08-17; end: 2025-12-01; status: on-track}

<!-- id: goal_2 -->


<!-- Canvas -->
# Canvas

## Sticky note {color: yellow; position: {x: 158, y: 100}; size: {width: 150, height: 100}}

<!-- id: sticky_note_1 -->
Todos
## Sticky note {color: yellow; position: {x: 453, y: 103}; size: {width: 150, height: 100}}

<!-- id: sticky_note_2 -->
On Going
## Sticky note {color: green; position: {x: 774, y: 97}; size: {width: 150, height: 100}}

<!-- id: sticky_note_3 -->
Done
## Sticky note {color: purple; position: {x: 161, y: 260}; size: {width: 760, height: 124}}

<!-- id: sticky_note_4 -->
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
<!-- Mindmap -->
# Mindmap

## Test Mindmap

<!-- id: mindmap_1 -->

- Main
  - Sub Level
    - Level 2
  - Sub Level #2
  - Edit mindmap
    - Awesome !

<!-- Board -->
# Board

## Todo

- [ ] (demo1) Demo Task {tag: [Frontend]; due_date: 2025-08-20; assignee: Demo User; priority: 1; effort: 2; milestone: Demo}
  This task demonstrates the working export and import functionality
- [ ] (import1) Imported Task 1 {tag: [Backend, API]; due_date: 2025-08-22; assignee: Test User; priority: 1; effort: 3; milestone: Sprint 1}
  This is an imported test task
- [ ] (import2) Imported Task 2 {tag: [Frontend]; due_date: 2025-08-25; assignee: Demo User; priority: 2; effort: 1; milestone: Sprint 1}
  Another imported task
  - [ ] (2) Child Task #1 {tag: [Bug]; assignee: Bob; priority: 2}

## In Progress

- [ ] (1) backup {tag: [Backend]; due_date: 2025-08-27T13; assignee: Jane Doe; priority: 2}

## Done

- [ ] (test1) Simple Test Task {tag: [Test]; due_date: 2025-08-22; assignee: Test User; priority: 1; effort: 1; milestone: Test}
  Test description
- [ ] (3) Almost ready ! {tag: [Bug]; assignee: Bob; priority: 1}
