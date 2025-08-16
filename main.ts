import { serve } from "deno/http";
import { serveDir } from "deno/http/file_server";
import { join } from "@std/path";
import { TaskAPI } from "./src/api/tasks.ts";

// Get markdown file from command line args or default to structure.md
const markdownFile = Deno.args[0] || "structure.md";
const taskAPI = new TaskAPI(markdownFile);

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // API routes
  if (url.pathname.startsWith("/api/")) {
    return await taskAPI.handle(req);
  }

  // Static files
  const response = await serveDir(req, {
    fsRoot: join(Deno.cwd(), "src/static"),
    urlRoot: "",
  });
  
  // Add no-cache headers for development
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

console.log(`Server running on http://localhost:8003`);
console.log(`Using markdown file: ${markdownFile}`);
await serve(handler, { port: 8003 });
