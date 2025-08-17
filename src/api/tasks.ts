import { join } from "@std/path";
import { MarkdownParser } from "../lib/markdown-parser.ts";
import { Task } from "../lib/types.ts";

export class TaskAPI {
  private parser: MarkdownParser;

  constructor(markdownFile: string = join(Deno.cwd(), "structure.md")) {
    this.parser = new MarkdownParser(join(markdownFile));
  }

  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method;
    const pathParts = url.pathname.split("/").filter((p) => p);

    // CORS headers
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (method === "OPTIONS") {
      return new Response(null, { status: 200, headers });
    }

    try {
      // GET /api/tasks
      if (
        method === "GET" && pathParts.length === 2 && pathParts[1] === "tasks"
      ) {
        const tasks = await this.parser.readTasks();
        return new Response(JSON.stringify(tasks), { headers });
      }

      // GET /api/project
      if (
        method === "GET" && pathParts.length === 2 && pathParts[1] === "project"
      ) {
        const projectInfo = await this.parser.readProjectInfo();
        return new Response(JSON.stringify(projectInfo), { headers });
      }

      // GET /api/project/config
      if (
        method === "GET" && pathParts.length === 3 &&
        pathParts[1] === "project" && pathParts[2] === "config"
      ) {
        const config = await this.parser.readProjectConfig();
        return new Response(JSON.stringify(config), { headers });
      }

      // GET /api/project/sections
      if (
        method === "GET" && pathParts.length === 3 &&
        pathParts[1] === "project" && pathParts[2] === "sections"
      ) {
        const sections = this.parser.getSectionsFromBoard();
        return new Response(JSON.stringify(sections), { headers });
      }

      // POST /api/project/config
      if (
        method === "POST" && pathParts.length === 3 &&
        pathParts[1] === "project" && pathParts[2] === "config"
      ) {
        const config = await req.json();
        const success = await this.parser.saveProjectConfig(config);
        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(
            JSON.stringify({ error: "Failed to save config" }),
            {
              status: 500,
              headers,
            },
          );
        }
      }

      // POST /api/project/rewrite
      if (
        method === "POST" && pathParts.length === 3 &&
        pathParts[1] === "project" && pathParts[2] === "rewrite"
      ) {
        console.log("Rewrite endpoint called");
        const body = await req.json();
        const tasks = await this.parser.readTasks();
        console.log("Current tasks count:", tasks.length);
        await this.parser.writeTasks(tasks, body.sections);
        console.log("Tasks rewritten with sections:", body.sections);
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // POST /api/tasks
      if (
        method === "POST" && pathParts.length === 2 && pathParts[1] === "tasks"
      ) {
        const body = await req.json();
        const taskId = await this.parser.addTask(body);
        return new Response(JSON.stringify({ id: taskId }), {
          status: 201,
          headers,
        });
      }

      // PUT /api/tasks/:id
      if (
        method === "PUT" && pathParts.length === 3 && pathParts[1] === "tasks"
      ) {
        const taskId = pathParts[2];
        const updates = await req.json();
        const success = await this.parser.updateTask(taskId, updates);

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Task not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // DELETE /api/tasks/:id
      if (
        method === "DELETE" && pathParts.length === 3 &&
        pathParts[1] === "tasks"
      ) {
        const taskId = pathParts[2];
        const success = await this.parser.deleteTask(taskId);

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Task not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // PATCH /api/tasks/:id/move
      if (
        method === "PATCH" && pathParts.length === 4 &&
        pathParts[1] === "tasks" && pathParts[3] === "move"
      ) {
        const taskId = pathParts[2];
        const { section } = await req.json();
        const success = await this.parser.updateTask(taskId, { section });

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Task not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // GET /api/tasks/:id
      if (
        method === "GET" && pathParts.length === 3 && pathParts[1] === "tasks"
      ) {
        const taskId = pathParts[2];
        const tasks = await this.parser.readTasks();
        const task = this.findTaskById(tasks, taskId);

        if (task) {
          return new Response(JSON.stringify(task), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Task not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // Notes API endpoints
      // GET /api/notes
      if (
        method === "GET" && pathParts.length === 2 && pathParts[1] === "notes"
      ) {
        const projectInfo = await this.parser.readProjectInfo();
        return new Response(JSON.stringify(projectInfo.notes), {
          headers,
        });
      }

      // POST /api/notes
      if (
        method === "POST" && pathParts.length === 2 && pathParts[1] === "notes"
      ) {
        const body = await req.json();
        const noteId = await this.parser.addNote(body);
        return new Response(JSON.stringify({ id: noteId }), {
          status: 201,
          headers,
        });
      }

      // PUT /api/notes/:id
      if (
        method === "PUT" && pathParts.length === 3 && pathParts[1] === "notes"
      ) {
        const noteId = pathParts[2];
        const updates = await req.json();
        const success = await this.parser.updateNote(noteId, updates);

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Note not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // DELETE /api/notes/:id
      if (
        method === "DELETE" && pathParts.length === 3 &&
        pathParts[1] === "notes"
      ) {
        const noteId = pathParts[2];
        const success = await this.parser.deleteNote(noteId);

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Note not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // GET /api/notes/:id
      if (
        method === "GET" && pathParts.length === 3 && pathParts[1] === "notes"
      ) {
        const noteId = pathParts[2];
        const projectInfo = await this.parser.readProjectInfo();
        const note = projectInfo.notes.find((n) => n.id === noteId);

        if (note) {
          return new Response(JSON.stringify(note), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Note not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // Goals API endpoints
      // GET /api/goals
      if (
        method === "GET" && pathParts.length === 2 && pathParts[1] === "goals"
      ) {
        const projectInfo = await this.parser.readProjectInfo();
        return new Response(JSON.stringify(projectInfo.goals), {
          headers,
        });
      }

      // POST /api/goals
      if (
        method === "POST" && pathParts.length === 2 && pathParts[1] === "goals"
      ) {
        const body = await req.json();
        const goalId = await this.parser.addGoal(body);
        return new Response(JSON.stringify({ id: goalId }), {
          status: 201,
          headers,
        });
      }

      // PUT /api/goals/:id
      if (
        method === "PUT" && pathParts.length === 3 && pathParts[1] === "goals"
      ) {
        const goalId = pathParts[2];
        const updates = await req.json();
        const success = await this.parser.updateGoal(goalId, updates);

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Goal not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // DELETE /api/goals/:id
      if (
        method === "DELETE" && pathParts.length === 3 &&
        pathParts[1] === "goals"
      ) {
        const goalId = pathParts[2];
        const success = await this.parser.deleteGoal(goalId);

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Goal not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // GET /api/goals/:id
      if (
        method === "GET" && pathParts.length === 3 && pathParts[1] === "goals"
      ) {
        const goalId = pathParts[2];
        const projectInfo = await this.parser.readProjectInfo();
        const goal = projectInfo.goals.find((g) => g.id === goalId);

        if (goal) {
          return new Response(JSON.stringify(goal), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Goal not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // Canvas API endpoints
      // GET /api/canvas/sticky_notes
      if (
        method === "GET" && pathParts.length === 3 &&
        pathParts[1] === "canvas" && pathParts[2] === "sticky_notes"
      ) {
        const projectInfo = await this.parser.readProjectInfo();
        console.debug(projectInfo);
        return new Response(JSON.stringify(projectInfo.stickyNotes), {
          headers,
        });
      }

      // POST /api/canvas/sticky_notes
      if (
        method === "POST" && pathParts.length === 3 &&
        pathParts[1] === "canvas" && pathParts[2] === "sticky_notes"
      ) {
        const body = await req.json();
        const stickyNoteId = await this.parser.addStickyNote(body);
        return new Response(JSON.stringify({ id: stickyNoteId }), {
          status: 201,
          headers,
        });
      }

      // PUT /api/canvas/sticky_notes/:id
      if (
        method === "PUT" && pathParts.length === 4 &&
        pathParts[1] === "canvas" && pathParts[2] === "sticky_notes"
      ) {
        const stickyNoteId = pathParts[3];
        const updates = await req.json();
        const success = await this.parser.updateStickyNote(
          stickyNoteId,
          updates,
        );

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(
            JSON.stringify({ error: "Sticky note not found" }),
            {
              status: 404,
              headers,
            },
          );
        }
      }

      // DELETE /api/canvas/sticky_notes/:id
      if (
        method === "DELETE" && pathParts.length === 4 &&
        pathParts[1] === "canvas" && pathParts[2] === "sticky_notes"
      ) {
        const stickyNoteId = pathParts[3];
        const success = await this.parser.deleteStickyNote(stickyNoteId);

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(
            JSON.stringify({ error: "Sticky note not found" }),
            {
              status: 404,
              headers,
            },
          );
        }
      }

      // Mindmap API endpoints
      // GET /api/mindmaps
      if (
        method === "GET" && pathParts.length === 2 &&
        pathParts[1] === "mindmaps"
      ) {
        const projectInfo = await this.parser.readProjectInfo();
        return new Response(JSON.stringify(projectInfo.mindmaps), {
          headers,
        });
      }

      // POST /api/mindmaps
      if (
        method === "POST" && pathParts.length === 2 &&
        pathParts[1] === "mindmaps"
      ) {
        const body = await req.json();
        const mindmapId = await this.parser.addMindmap(body);
        return new Response(JSON.stringify({ id: mindmapId }), {
          status: 201,
          headers,
        });
      }

      // PUT /api/mindmaps/:id
      if (
        method === "PUT" && pathParts.length === 3 &&
        pathParts[1] === "mindmaps"
      ) {
        const mindmapId = pathParts[2];
        const updates = await req.json();
        const success = await this.parser.updateMindmap(mindmapId, updates);

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Mindmap not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // DELETE /api/mindmaps/:id
      if (
        method === "DELETE" && pathParts.length === 3 &&
        pathParts[1] === "mindmaps"
      ) {
        const mindmapId = pathParts[2];
        const success = await this.parser.deleteMindmap(mindmapId);

        if (success) {
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Mindmap not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // GET /api/mindmaps/:id
      if (
        method === "GET" && pathParts.length === 3 &&
        pathParts[1] === "mindmaps"
      ) {
        const mindmapId = pathParts[2];
        const projectInfo = await this.parser.readProjectInfo();
        const mindmap = projectInfo.mindmaps.find((m) => m.id === mindmapId);

        if (mindmap) {
          return new Response(JSON.stringify(mindmap), { headers });
        } else {
          return new Response(JSON.stringify({ error: "Mindmap not found" }), {
            status: 404,
            headers,
          });
        }
      }

      // CSV Export endpoints
      // GET /api/export/csv/tasks
      if (
        method === "GET" && pathParts.length === 4 &&
        pathParts[1] === "export" && pathParts[2] === "csv" &&
        pathParts[3] === "tasks"
      ) {
        const tasks = await this.parser.readTasks();
        const csv = this.convertTasksToCSV(tasks);
        return new Response(csv, {
          headers: {
            ...headers,
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=tasks.csv",
          },
        });
      }

      // GET /api/export/csv/canvas
      if (
        method === "GET" && pathParts.length === 4 &&
        pathParts[1] === "export" && pathParts[2] === "csv" &&
        pathParts[3] === "canvas"
      ) {
        const projectInfo = await this.parser.readProjectInfo();
        const csv = this.convertCanvasToCSV(projectInfo.stickyNotes);
        return new Response(csv, {
          headers: {
            ...headers,
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=canvas.csv",
          },
        });
      }

      // GET /api/export/csv/mindmaps
      if (
        method === "GET" && pathParts.length === 4 &&
        pathParts[1] === "export" && pathParts[2] === "csv" &&
        pathParts[3] === "mindmaps"
      ) {
        const projectInfo = await this.parser.readProjectInfo();
        const csv = this.convertMindmapsToCSV(projectInfo.mindmaps);
        return new Response(csv, {
          headers: {
            ...headers,
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=mindmaps.csv",
          },
        });
      }

      // POST /api/import/csv/tasks
      if (
        method === "POST" && pathParts.length === 4 &&
        pathParts[1] === "import" && pathParts[2] === "csv" &&
        pathParts[3] === "tasks"
      ) {
        const body = await req.text();
        const importedTasks = this.parseTasksCSV(body);
        const existingTasks = await this.parser.readTasks();

        // Filter out tasks that already exist by title to avoid duplicates
        const existingTitles = new Set(existingTasks.map((t) => t.title));
        const newTasks = importedTasks.filter((t) =>
          !existingTitles.has(t.title)
        );

        if (newTasks.length === 0) {
          return new Response(
            JSON.stringify({
              success: true,
              imported: 0,
              message: "No new tasks to import (all tasks already exist)",
            }),
            { headers },
          );
        }

        // Use a safer direct markdown append method
        const importedCount = await this.appendTasksToMarkdown(newTasks);

        return new Response(
          JSON.stringify({ success: true, imported: importedCount }),
          { headers },
        );
      }

      // POST /api/import/csv/canvas
      if (
        method === "POST" && pathParts.length === 4 &&
        pathParts[1] === "import" && pathParts[2] === "csv" &&
        pathParts[3] === "canvas"
      ) {
        const body = await req.text();
        const stickyNotes = this.parseCanvasCSV(body);
        const projectInfo = await this.parser.readProjectInfo();
        projectInfo.stickyNotes = stickyNotes;
        await this.parser.saveProjectInfo(projectInfo);
        return new Response(
          JSON.stringify({ success: true, imported: stickyNotes.length }),
          { headers },
        );
      }

      // GET /api/export/pdf/report
      if (
        method === "GET" && pathParts.length === 4 &&
        pathParts[1] === "export" && pathParts[2] === "pdf" &&
        pathParts[3] === "report"
      ) {
        const projectInfo = await this.parser.readProjectInfo();
        const tasks = await this.parser.readTasks();
        const config = await this.parser.readProjectConfig();

        const html = this.generateProjectReportHTML(projectInfo, tasks, config);

        return new Response(html, {
          headers: {
            ...headers,
            "Content-Type": "text/html",
            "Content-Disposition": "inline; filename=project-report.html",
          },
        });
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers,
      });
    } catch (error) {
      console.error("API Error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers,
      });
    }
  }

  private findTaskById(tasks: Task[], id: string): Task | null {
    for (const task of tasks) {
      if (task.id === id) {
        return task;
      }
      if (task.children) {
        const found = this.findTaskById(task.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private convertTasksToCSV(tasks: Task[]): string {
    const headers = [
      "ID",
      "Title",
      "Section",
      "Completed",
      "Priority",
      "Assignee",
      "Due Date",
      "Effort",
      "Tags",
      "Blocked By",
      "Milestone",
      "Description",
    ];
    let csv = headers.join(",") + "\n";

    const flatTasks = this.flattenTasks(tasks);

    for (const task of flatTasks) {
      const row = [
        this.escapeCSV(task.id),
        this.escapeCSV(task.title),
        this.escapeCSV(task.section),
        task.completed ? "TRUE" : "FALSE",
        this.escapeCSV(task.config.priority?.toString() || ""),
        this.escapeCSV(task.config.assignee || ""),
        this.escapeCSV(task.config.due_date || ""),
        this.escapeCSV(task.config.effort?.toString() || ""),
        this.escapeCSV(task.config.tag?.join(", ") || ""),
        this.escapeCSV(task.config.blocked_by?.join(", ") || ""),
        this.escapeCSV(task.config.milestone || ""),
        this.escapeCSV(task.description?.join(" ") || ""),
      ];
      csv += row.join(",") + "\n";
    }

    return csv;
  }

  private convertCanvasToCSV(stickyNotes: any[]): string {
    const headers = [
      "ID",
      "Content",
      "Color",
      "Position X",
      "Position Y",
      "Width",
      "Height",
    ];
    let csv = headers.join(",") + "\n";

    for (const stickyNote of stickyNotes) {
      const row = [
        this.escapeCSV(stickyNote.id),
        this.escapeCSV(stickyNote.content),
        this.escapeCSV(stickyNote.color),
        stickyNote.position.x.toString(),
        stickyNote.position.y.toString(),
        this.escapeCSV(stickyNote.size?.width?.toString() || ""),
        this.escapeCSV(stickyNote.size?.height?.toString() || ""),
      ];
      csv += row.join(",") + "\n";
    }

    return csv;
  }

  private convertMindmapsToCSV(mindmaps: any[]): string {
    const headers = [
      "Mindmap ID",
      "Mindmap Title",
      "Node ID",
      "Node Text",
      "Level",
      "Parent ID",
    ];
    let csv = headers.join(",") + "\n";

    for (const mindmap of mindmaps) {
      for (const node of mindmap.nodes) {
        const row = [
          this.escapeCSV(mindmap.id),
          this.escapeCSV(mindmap.title),
          this.escapeCSV(node.id),
          this.escapeCSV(node.text),
          node.level.toString(),
          this.escapeCSV(node.parent || ""),
        ];
        csv += row.join(",") + "\n";
      }
    }

    return csv;
  }

  private parseTasksCSV(csvContent: string): Task[] {
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) return [];

    const tasks: Task[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length >= 4) {
        const task: Task = {
          id: values[0] || `task_${Date.now()}_${i}`,
          title: values[1] || "",
          section: values[2] || "Backlog",
          completed: values[3]?.toUpperCase() === "TRUE",
          config: {
            priority: values[4] ? parseInt(values[4]) : undefined,
            assignee: values[5] || undefined,
            due_date: values[6] || undefined,
            effort: values[7] ? parseInt(values[7]) : undefined,
            tag: values[8]
              ? values[8].split(", ").filter((t) => t.trim())
              : undefined,
            blocked_by: values[9]
              ? values[9].split(", ").filter((t) => t.trim())
              : undefined,
            milestone: values[10] || undefined,
          },
          description: values[11] ? [values[11]] : undefined,
        };

        tasks.push(task);
      }
    }

    return tasks;
  }

  private parseCanvasCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",");
    const stickyNotes = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length >= 5) {
        const stickyNote = {
          id: values[0] || `sticky_note_${Date.now()}_${i}`,
          content: values[1] || "",
          color: values[2] || "yellow",
          position: {
            x: parseInt(values[3]) || 0,
            y: parseInt(values[4]) || 0,
          },
        };

        if (values[5] && values[6]) {
          stickyNote.size = {
            width: parseInt(values[5]) || 200,
            height: parseInt(values[6]) || 150,
          };
        }

        stickyNotes.push(stickyNote);
      }
    }

    return stickyNotes;
  }

  private flattenTasks(tasks: Task[]): Task[] {
    const flattened: Task[] = [];
    for (const task of tasks) {
      flattened.push(task);
      if (task.children && task.children.length > 0) {
        flattened.push(...this.flattenTasks(task.children));
      }
    }
    return flattened;
  }

  private escapeCSV(value: string): string {
    if (!value) return '""';
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  private generateProjectReportHTML(
    projectInfo: any,
    tasks: Task[],
    config: any,
  ): string {
    const totalTasks = this.flattenTasks(tasks).length;
    const completedTasks =
      this.flattenTasks(tasks).filter((t) => t.completed).length;
    const progressPercent = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Get section statistics
    const sections = [...new Set(tasks.map((t) => t.section))];
    const sectionStats = sections.map((section) => {
      const sectionTasks = tasks.filter((t) => t.section === section);
      const sectionCompleted = sectionTasks.filter((t) => t.completed).length;
      return {
        name: section,
        total: sectionTasks.length,
        completed: sectionCompleted,
        progress: sectionTasks.length > 0
          ? Math.round((sectionCompleted / sectionTasks.length) * 100)
          : 0,
      };
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Report - ${projectInfo.name}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        @media print {
            body { font-size: 12px; }
            .no-print { display: none; }
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 2.5em;
        }
        .header .subtitle {
            color: #666;
            font-size: 1.1em;
            margin-top: 10px;
        }
        .section {
            margin-bottom: 25px;
            break-inside: avoid;
        }
        .section h2 {
            color: #3b82f6;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        .progress-bar {
            background: #e5e7eb;
            border-radius: 10px;
            height: 20px;
            margin: 10px 0;
            overflow: hidden;
        }
        .progress-fill {
            background: linear-gradient(90deg, #10b981, #3b82f6);
            height: 100%;
            transition: width 0.3s ease;
        }
        .task-list {
            margin: 15px 0;
        }
        .task-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .task-status {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
        }
        .task-completed {
            background: #10b981;
        }
        .task-pending {
            background: #6b7280;
        }
        .goal-item {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .goal-title {
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 8px;
        }
        .goal-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            font-size: 0.9em;
            color: #666;
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        .no-print {
            margin: 20px 0;
            text-align: center;
        }
        .print-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }
        .print-btn:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">📄 Print/Save as PDF</button>
    </div>

    <div class="header">
        <h1>${projectInfo.name}</h1>
        <div class="subtitle">Project Report • Generated on ${
      new Date().toLocaleDateString()
    }</div>
    </div>

    <div class="section">
        <h2>Project Overview</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${totalTasks}</div>
                <div class="stat-label">Total Tasks</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${completedTasks}</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${progressPercent}%</div>
                <div class="stat-label">Progress</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${sections.length}</div>
                <div class="stat-label">Sections</div>
            </div>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>

        ${
      projectInfo.description
        ? `<p>${projectInfo.description.join(" ")}</p>`
        : ""
    }
    </div>

    <div class="section">
        <h2>Section Breakdown</h2>
        ${
      sectionStats.map((section) => `
            <div style="margin-bottom: 20px;">
                <h3>${section.name}</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span>${section.completed}/${section.total} tasks completed</span>
                    <span><strong>${section.progress}%</strong></span>
                </div>
                <div class="progress-bar" style="height: 12px;">
                    <div class="progress-fill" style="width: ${section.progress}%"></div>
                </div>
            </div>
        `).join("")
    }
    </div>

    ${
      projectInfo.goals && projectInfo.goals.length > 0
        ? `
    <div class="section">
        <h2>Goals</h2>
        ${
          projectInfo.goals.map((goal) => `
            <div class="goal-item">
                <div class="goal-title">${goal.title}</div>
                <div class="goal-meta">
                    <div>Type: ${goal.type}</div>
                    <div>Status: ${goal.status}</div>
                    <div>KPI: ${goal.kpi}</div>
                    <div>Timeline: ${goal.startDate} - ${goal.endDate}</div>
                </div>
                ${goal.description ? `<div>${goal.description}</div>` : ""}
            </div>
        `).join("")
        }
    </div>
    `
        : ""
    }

    <div class="section">
        <h2>Recent Tasks</h2>
        <div class="task-list">
            ${
      this.flattenTasks(tasks).slice(0, 20).map((task) => `
                <div class="task-item">
                    <div class="task-status ${
        task.completed ? "task-completed" : "task-pending"
      }">
                        ${task.completed ? "✓" : "○"}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${task.title}</div>
                        <div style="font-size: 0.9em; color: #666;">
                            ${task.section}${
        task.config.assignee ? ` • ${task.config.assignee}` : ""
      }${task.config.due_date ? ` • Due: ${task.config.due_date}` : ""}
                        </div>
                    </div>
                </div>
            `).join("")
    }
        </div>
    </div>

    <div class="footer">
        <p>Generated by MD Planner • ${new Date().toISOString()}</p>
    </div>

    <script>
        // Auto-print when accessed from PDF export
        if (window.location.search.includes('auto-print')) {
            window.onload = () => setTimeout(() => window.print(), 1000);
        }
    </script>
</body>
</html>`;
  }

  private async appendTasksToMarkdown(tasks: Task[]): Promise<number> {
    try {
      // Read the current markdown file
      const currentContent = await Deno.readTextFile(this.parser.filePath);

      // Find the Todo section and append tasks there
      const lines = currentContent.split("\n");
      let todoSectionIndex = -1;
      let insertIndex = -1;

      // Find the "## Todo" section
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === "## Todo") {
          todoSectionIndex = i;
          // Find the next section or end of file to insert before
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].startsWith("## ") && lines[j].trim() !== "## Todo") {
              insertIndex = j - 1;
              // Skip backward over any empty lines
              while (insertIndex > i && lines[insertIndex].trim() === "") {
                insertIndex--;
              }
              insertIndex++; // Insert after the last task/content
              break;
            }
          }
          if (insertIndex === -1) {
            insertIndex = lines.length;
          }
          break;
        }
      }

      // If no Todo section found, we'll add it after the Board header
      if (todoSectionIndex === -1) {
        const boardIndex = lines.findIndex((line) => line.trim() === "# Board");
        if (boardIndex !== -1) {
          // Insert Todo section after Board header
          lines.splice(boardIndex + 1, 0, "", "## Todo", "");
          insertIndex = boardIndex + 4;
        } else {
          // Append at end if no Board section found
          lines.push("", "<!-- Board -->", "# Board", "", "## Todo", "");
          insertIndex = lines.length;
        }
      }

      // Generate markdown for each task
      const taskLines: string[] = [];
      for (const task of tasks) {
        const checkbox = task.completed ? "[x]" : "[ ]";
        const configParts: string[] = [];

        if (task.config.tag && task.config.tag.length > 0) {
          configParts.push(`tag: [${task.config.tag.join(", ")}]`);
        }
        if (task.config.due_date) {
          configParts.push(`due_date: ${task.config.due_date}`);
        }
        if (task.config.assignee) {
          configParts.push(`assignee: ${task.config.assignee}`);
        }
        if (task.config.priority) {
          configParts.push(`priority: ${task.config.priority}`);
        }
        if (task.config.effort) {
          configParts.push(`effort: ${task.config.effort}`);
        }
        if (task.config.milestone) {
          configParts.push(`milestone: ${task.config.milestone}`);
        }
        if (task.config.blocked_by && task.config.blocked_by.length > 0) {
          configParts.push(`blocked_by: ${task.config.blocked_by.join(", ")}`);
        }

        const configStr = configParts.length > 0
          ? ` {${configParts.join("; ")}}`
          : "";
        taskLines.push(`- ${checkbox} (${task.id}) ${task.title}${configStr}`);

        // Add description if present
        if (task.description && task.description.length > 0) {
          task.description.forEach((desc) => {
            taskLines.push(`  ${desc}`);
          });
        }
        taskLines.push(""); // Empty line after each task
      }

      // Insert the new tasks
      lines.splice(insertIndex, 0, ...taskLines);

      // Write the updated content back
      await Deno.writeTextFile(this.parser.filePath, lines.join("\n"));

      return tasks.length;
    } catch (error) {
      console.error("Error appending tasks to markdown:", error);
      return 0;
    }
  }
}
