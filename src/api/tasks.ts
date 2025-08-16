import { join } from "@std/path";
import { MarkdownParser, Task } from "../lib/markdown-parser.ts";

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
}
