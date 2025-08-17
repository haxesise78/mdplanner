import {
  Goal,
  Mindmap,
  MindmapNode,
  Note,
  PostIt,
  ProjectConfig,
  ProjectInfo,
  Task,
  TaskConfig,
} from "./types.ts";

export class MarkdownParser {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async readTasks(): Promise<Task[]> {
    try {
      const content = await Deno.readTextFile(this.filePath);
      return this.parseMarkdown(content);
    } catch (error) {
      console.error("Error reading markdown file:", error);
      return [];
    }
  }

  async readProjectInfo(): Promise<ProjectInfo> {
    try {
      const content = await Deno.readTextFile(this.filePath);
      return this.parseProjectInfo(content);
    } catch (error) {
      console.error("Error reading markdown file:", error);
      return {
        name: "Untitled Project",
        description: [],
        notes: [],
        goals: [],
        postIts: [],
        mindmaps: [],
      };
    }
  }

  private parseProjectInfo(content: string): ProjectInfo {
    const lines = content.split("\n");
    let projectName = "Untitled Project";
    const description: string[] = [];
    const notes: Note[] = [];
    const goals: Goal[] = [];
    const postIts: PostIt[] = [];
    const mindmaps: Mindmap[] = [];
    let i = 0;
    let foundFirstHeader = false;
    let inConfigSection = false;
    let inNotesSection = false;
    let inGoalsSection = false;
    let inCanvasSection = false;
    let inMindmapSection = false;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Find the first # header (project name)
      if (line.startsWith("# ") && !foundFirstHeader) {
        projectName = line.substring(2).trim();
        foundFirstHeader = true;
        i++;
        continue;
      }

      // Check which section we're entering
      // Check for section boundary comments
      if (line.trim() === "<!-- Configurations -->") {
        inConfigSection = true;
        inNotesSection = false;
        inGoalsSection = false;
        i++;
        continue;
      }

      if (line.trim() === "<!-- Notes -->") {
        inNotesSection = true;
        inConfigSection = false;
        inGoalsSection = false;
        i++;
        continue;
      }

      if (line.trim() === "<!-- Goals -->") {
        inGoalsSection = true;
        inConfigSection = false;
        inNotesSection = false;
        inCanvasSection = false;
        inMindmapSection = false;
        i++;
        continue;
      }

      if (line.trim() === "<!-- Canvas -->") {
        inCanvasSection = true;
        inConfigSection = false;
        inNotesSection = false;
        inGoalsSection = false;
        inMindmapSection = false;
        i++;
        continue;
      }

      if (line.trim() === "<!-- Mindmap -->") {
        inMindmapSection = true;
        inConfigSection = false;
        inNotesSection = false;
        inGoalsSection = false;
        inCanvasSection = false;
        i++;
        continue;
      }

      if (line === "# Configurations") {
        inConfigSection = true;
        inNotesSection = false;
        inGoalsSection = false;
        inCanvasSection = false;
        inMindmapSection = false;
        i++;
        continue;
      }

      if (line === "# Notes") {
        inNotesSection = true;
        inConfigSection = false;
        inGoalsSection = false;
        inCanvasSection = false;
        inMindmapSection = false;
        i++;
        continue;
      }

      if (line === "# Goals") {
        inGoalsSection = true;
        inConfigSection = false;
        inNotesSection = false;
        inCanvasSection = false;
        inMindmapSection = false;
        i++;
        continue;
      }

      if (line === "# Canvas") {
        inCanvasSection = true;
        inConfigSection = false;
        inNotesSection = false;
        inGoalsSection = false;
        inMindmapSection = false;
        i++;
        continue;
      }

      if (line === "# Mindmap") {
        inMindmapSection = true;
        inConfigSection = false;
        inNotesSection = false;
        inGoalsSection = false;
        inCanvasSection = false;
        i++;
        continue;
      }

      // Stop at Board section or other sections
      if (
        (line.startsWith("## ") ||
          (line.startsWith("# ") &&
            !["# Configurations", "# Notes", "# Goals", "# Canvas", "# Mindmap"]
              .includes(line))) && foundFirstHeader
      ) {
        if (inNotesSection) {
          const notesResult = this.parseNotesSection(lines, i);
          notes.push(...notesResult.notes);
          i = notesResult.nextIndex;
          inNotesSection = false;
          continue;
        }
        if (inGoalsSection) {
          const goalsResult = this.parseGoalsSection(lines, i);
          goals.push(...goalsResult.goals);
          i = goalsResult.nextIndex;
          inGoalsSection = false;
          continue;
        }
        if (inCanvasSection) {
          const canvasResult = this.parseCanvasSection(lines, i);
          postIts.push(...canvasResult.postIts);
          i = canvasResult.nextIndex;
          inCanvasSection = false;
          continue;
        }
        if (inMindmapSection) {
          const mindmapResult = this.parseMindmapSection(lines, i);
          mindmaps.push(...mindmapResult.mindmaps);
          i = mindmapResult.nextIndex;
          inMindmapSection = false;
          continue;
        }
        break;
      }

      // Parse notes in Notes section
      if (inNotesSection && line.startsWith("## ")) {
        const notesResult = this.parseNotesSection(lines, i);
        notes.push(...notesResult.notes);
        i = notesResult.nextIndex;
        continue;
      }

      // Parse goals in Goals section
      if (inGoalsSection && line.startsWith("## ")) {
        const goalsResult = this.parseGoalsSection(lines, i);
        goals.push(...goalsResult.goals);
        i = goalsResult.nextIndex;
        continue;
      }

      // Parse post-its in Canvas section
      if (inCanvasSection && line.startsWith("## ")) {
        const canvasResult = this.parseCanvasSection(lines, i);
        postIts.push(...canvasResult.postIts);
        i = canvasResult.nextIndex;
        continue;
      }

      // Parse mindmaps in Mindmap section
      if (inMindmapSection && line.startsWith("## ")) {
        const mindmapResult = this.parseMindmapSection(lines, i);
        mindmaps.push(...mindmapResult.mindmaps);
        i = mindmapResult.nextIndex;
        continue;
      }

      // Skip configuration section content for description
      if (
        inConfigSection || inNotesSection || inGoalsSection ||
        inCanvasSection || inMindmapSection
      ) {
        i++;
        continue;
      }

      // Collect description lines (skip empty lines at the start)
      if (
        foundFirstHeader && line && !inConfigSection && !inNotesSection &&
        !inGoalsSection && !inCanvasSection && !inMindmapSection
      ) {
        description.push(line);
      } else if (
        foundFirstHeader && !line && description.length > 0 &&
        !inConfigSection && !inNotesSection && !inGoalsSection &&
        !inCanvasSection && !inMindmapSection
      ) {
        // Keep empty lines if we already have content
        description.push("");
      }

      i++;
    }

    return { name: projectName, description, notes, goals, postIts, mindmaps };
  }

  private parseNotesSection(
    lines: string[],
    startIndex: number,
  ): { notes: Note[]; nextIndex: number } {
    const notes: Note[] = [];
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Stop at next major section
      if (line.startsWith("# ") && !line.startsWith("## ")) {
        break;
      }

      // Parse note tab (## Note Title)
      if (line.startsWith("## ")) {
        const title = line.substring(3).trim();
        const noteContent: string[] = [];
        i++;

        // Collect note content until next note or major section
        while (i < lines.length) {
          const contentLine = lines[i];
          const trimmedLine = contentLine.trim();

          // Break on section boundary comments
          if (
            trimmedLine.match(
              /<!-- (Board|Goals|Configurations|Notes|Canvas|Mindmap) -->/,
            )
          ) {
            break;
          }

          // Check if this is a new note (## followed by <!-- id: note_X --> within a few lines)
          if (trimmedLine.startsWith("## ")) {
            // Look ahead to see if there's an ID comment coming up
            let hasIdComment = false;
            for (
              let lookAhead = i + 1;
              lookAhead < Math.min(i + 5, lines.length);
              lookAhead++
            ) {
              if (lines[lookAhead].trim().match(/<!-- id: note_\d+ -->/)) {
                hasIdComment = true;
                break;
              }
              // If we hit another ## or section boundary, stop looking
              if (
                lines[lookAhead].trim().startsWith("##") ||
                lines[lookAhead].trim().match(
                  /<!-- (Board|Goals|Configurations|Notes|Canvas|Mindmap) -->/,
                )
              ) {
                break;
              }
            }

            // If we found an ID comment, this is a new note
            if (hasIdComment) {
              break;
            }
          }

          noteContent.push(contentLine);
          i++;
        }

        // Check for existing ID in comment format <!-- id: note_xxx -->
        let noteId = this.generateNoteId();
        let actualContent = noteContent.join("\n").trim();

        const idMatch = actualContent.match(/<!-- id: (note_\d+) -->/);
        if (idMatch) {
          noteId = idMatch[1];
          // Remove the ID comment from content
          actualContent = actualContent.replace(/<!-- id: note_\d+ -->\s*/, "")
            .trim();
        }

        notes.push({
          id: noteId,
          title,
          content: actualContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        continue;
      }

      i++;
    }

    return { notes, nextIndex: i };
  }

  private parseGoalsSection(
    lines: string[],
    startIndex: number,
  ): { goals: Goal[]; nextIndex: number } {
    const goals: Goal[] = [];
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Stop at next major section
      if (line.startsWith("# ") && !line.startsWith("## ")) {
        break;
      }

      // Parse goal (## Goal Title {type: enterprise; kpi: 30% revenue; start: 2024-01-01; end: 2024-12-31; status: on-track})
      if (line.startsWith("## ")) {
        const goalMatch = line.match(/^## (.+?)\s*\{(.+)\}$/);
        if (goalMatch) {
          const [, title, configStr] = goalMatch;
          const goalDescription: string[] = [];
          i++;

          // Collect goal description until next ## or # or boundary comment
          while (i < lines.length) {
            const contentLine = lines[i];
            const trimmedLine = contentLine.trim();

            // Stop at next goal, section, or boundary comment
            if (
              trimmedLine.startsWith("## ") ||
              trimmedLine.startsWith("# ") ||
              trimmedLine.match(/<!-- (Board|Goals|Configurations|Notes) -->/)
            ) {
              break;
            }

            if (trimmedLine) {
              goalDescription.push(trimmedLine);
            }
            i++;
          }

          // Check for existing ID in comment format <!-- id: goal_xxx -->
          let goalId = this.generateGoalId();
          let actualDescription = goalDescription.join("\n");

          const idMatch = actualDescription.match(/<!-- id: (goal_\d+) -->/);
          if (idMatch) {
            goalId = idMatch[1];
            // Remove the ID comment from description
            actualDescription = actualDescription.replace(
              /<!-- id: goal_\d+ -->\s*/,
              "",
            ).trim();
          }

          // Parse goal config
          const goal: Goal = {
            id: goalId,
            title,
            description: actualDescription,
            type: "project",
            kpi: "",
            startDate: "",
            endDate: "",
            status: "planning",
          };

          // Parse config string
          const configPairs = configStr.split(";");
          for (const pair of configPairs) {
            const [key, value] = pair.split(":").map((s) => s.trim());
            if (key && value) {
              switch (key) {
                case "type":
                  goal.type = value as "enterprise" | "project";
                  break;
                case "kpi":
                  goal.kpi = value;
                  break;
                case "start":
                  goal.startDate = value;
                  break;
                case "end":
                  goal.endDate = value;
                  break;
                case "status":
                  goal.status = value as Goal["status"];
                  break;
              }
            }
          }

          goals.push(goal);
          continue;
        }
      }

      i++;
    }

    return { goals, nextIndex: i };
  }

  private parseCanvasSection(
    lines: string[],
    startIndex: number,
  ): { postIts: PostIt[]; nextIndex: number } {
    const postIts: PostIt[] = [];
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Stop at next major section
      if (line.startsWith("# ") && !line.startsWith("## ")) {
        break;
      }

      // Parse post-it (## PostIt Content {color: yellow; position: {x: 100, y: 200}})
      if (line.startsWith("## ")) {
        const postItMatch = line.match(/^## (.+?)\s*\{(.+)\}$/);
        if (postItMatch) {
          const [, headerContent, configStr] = postItMatch;
          i++;

          // Check for existing ID in comment format <!-- id: postit_xxx -->
          let postItId = this.generatePostItId();
          let bodyContent = "";

          // Look for ID comment first
          while (i < lines.length) {
            const currentLine = lines[i].trim();

            // Check for ID comment
            const idMatch = currentLine.match(/<!-- id: (postit_\d+) -->/);
            if (idMatch) {
              postItId = idMatch[1];
              i++; // Move past the ID comment
              break;
            }

            // Stop if we hit another post-it or section
            if (
              currentLine.startsWith("## ") || currentLine.startsWith("# ") ||
              currentLine.startsWith("<!--")
            ) {
              break;
            }

            i++;
          }

          // Collect content after ID comment until next section
          while (i < lines.length) {
            const currentLine = lines[i].trim();

            // Stop if we hit another post-it or section
            if (
              currentLine.startsWith("## ") || currentLine.startsWith("# ") ||
              currentLine.startsWith("<!--")
            ) {
              break;
            }

            // Collect content (preserve original spacing)
            bodyContent += (bodyContent ? "<br>" : "") + lines[i];
            i++;
          }

          // ALL post-its now use "Post-it" header, content is always in body
          const finalContent = bodyContent.trim() || headerContent;

          const postIt: PostIt = {
            id: postItId,
            content: finalContent,
            color: "yellow",
            position: { x: 0, y: 0 },
          };

          // Parse config string - handle nested braces properly
          const configPairs = this.parseConfigString(configStr);
          for (const [key, value] of configPairs) {
            if (key && value) {
              switch (key) {
                case "color":
                  postIt.color = value as PostIt["color"];
                  break;
                case "position":
                  try {
                    const posMatch = value.match(
                      /\{\s*x:\s*(\d+),\s*y:\s*(\d+)\s*\}/,
                    );
                    if (posMatch) {
                      postIt.position = {
                        x: parseInt(posMatch[1]),
                        y: parseInt(posMatch[2]),
                      };
                    }
                  } catch (e) {
                    console.error("Error parsing position:", e);
                  }
                  break;
                case "size":
                  try {
                    const sizeMatch = value.match(
                      /\{\s*width:\s*(\d+),\s*height:\s*(\d+)\s*\}/,
                    );
                    if (sizeMatch) {
                      postIt.size = {
                        width: parseInt(sizeMatch[1]),
                        height: parseInt(sizeMatch[2]),
                      };
                    }
                  } catch (e) {
                    console.error("Error parsing size:", e);
                  }
                  break;
              }
            }
          }

          postIts.push(postIt);
          continue;
        }
      }

      i++;
    }

    return { postIts, nextIndex: i };
  }

  private parseMindmapSection(
    lines: string[],
    startIndex: number,
  ): { mindmaps: Mindmap[]; nextIndex: number } {
    const mindmaps: Mindmap[] = [];
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Stop at next major section
      if (line.startsWith("# ") && !line.startsWith("## ")) {
        break;
      }

      // Parse mindmap title (## Mindmap Title)
      if (line.startsWith("## ")) {
        const title = line.substring(3).trim();
        i++;

        // Check for existing ID in comment format <!-- id: mindmap_xxx -->
        let mindmapId = this.generateMindmapId();

        // Look for ID comment in next few lines
        for (
          let lookAhead = i;
          lookAhead < Math.min(i + 3, lines.length);
          lookAhead++
        ) {
          const idMatch = lines[lookAhead].trim().match(
            /<!-- id: (mindmap_\d+) -->/,
          );
          if (idMatch) {
            mindmapId = idMatch[1];
            break;
          }
        }

        const nodes: MindmapNode[] = [];

        // Parse the ul>li structure
        while (i < lines.length) {
          const contentLine = lines[i];
          const trimmedLine = contentLine.trim();

          // Stop at next mindmap, section, or boundary comment
          if (
            trimmedLine.startsWith("## ") ||
            trimmedLine.startsWith("# ") ||
            trimmedLine.match(
              /<!-- (Board|Goals|Configurations|Notes|Canvas|Mindmap) -->/,
            )
          ) {
            break;
          }

          // Parse list items
          if (trimmedLine.match(/^[-*+]\s+/)) {
            const level =
              (contentLine.length - contentLine.trimStart().length) / 2; // Assuming 2 spaces per level
            const text = trimmedLine.replace(/^[-*+]\s+/, "");

            if (text) {
              const node: MindmapNode = {
                id: `${mindmapId}_node_${nodes.length + 1}`,
                text,
                level,
                children: [],
              };

              // Find parent based on level
              if (level > 0) {
                for (let j = nodes.length - 1; j >= 0; j--) {
                  if (nodes[j].level === level - 1) {
                    node.parent = nodes[j].id;
                    nodes[j].children.push(node);
                    break;
                  }
                }
              }

              nodes.push(node);
            }
          }

          i++;
        }

        mindmaps.push({
          id: mindmapId,
          title,
          nodes,
        });
        continue;
      }

      i++;
    }

    return { mindmaps, nextIndex: i };
  }

  private parseMarkdown(content: string): Task[] {
    const lines = content.split("\n");
    const tasks: Task[] = [];
    let currentSection = "";
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Parse sections (## Section Name)
      if (line.startsWith("## ")) {
        currentSection = line.substring(3).trim();
        i++;
        continue;
      }

      // Parse tasks (- [ ] or - [x])
      if (line.match(/^- \[([ x])\]/)) {
        const result = this.parseTask(lines, i, currentSection);
        if (result.task) {
          tasks.push(result.task);
        }
        i = result.nextIndex;
        continue;
      }

      i++;
    }

    return tasks;
  }

  private parseTask(
    lines: string[],
    startIndex: number,
    section: string,
  ): { task: Task | null; nextIndex: number } {
    const line = lines[startIndex];
    let i = startIndex + 1;

    // Extract task info from line
    const taskMatch = line.match(
      /^(\s*)- \[([ x])\] (?:\(([^)]+)\))?\s*(.+?)(?:\s*\{([^}]+)\})?$/,
    );
    if (!taskMatch) {
      return { task: null, nextIndex: i };
    }

    const [, indent, completedChar, id, title, configStr] = taskMatch;
    const completed = completedChar === "x";
    const indentLevel = indent.length;

    // Parse config
    const config: TaskConfig = {};
    if (configStr) {
      const configPairs = configStr.split(";");
      for (const pair of configPairs) {
        const [key, value] = pair.split(":").map((s) => s.trim());
        if (key && value) {
          switch (key) {
            case "tag":
              config.tag = value.replace(/[\[\]]/g, "").split(",").map((t) =>
                t.trim()
              );
              break;
            case "due_date":
              config.due_date = value;
              break;
            case "assignee":
              config.assignee = value;
              break;
            case "priority":
              config.priority = parseInt(value);
              break;
            case "effort":
              config.effort = parseInt(value);
              break;
            case "blocked_by":
              config.blocked_by = value.replace(/[\[\]]/g, "").split(",").map(
                (t) => t.trim(),
              ).filter((t) => t);
              break;
            case "milestone":
              config.milestone = value;
              break;
          }
        }
      }
    }

    const task: Task = {
      id: id || this.generateNextTaskId(),
      title,
      completed,
      section,
      config,
      description: [],
      children: [],
    };

    // Parse description and children
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextIndent = nextLine.length - nextLine.trimStart().length;

      // If we hit a line with same or less indentation that's not a continuation, we're done
      if (nextLine.trim() && nextIndent <= indentLevel) {
        break;
      }

      // If it's a subtask
      if (nextLine.match(/^\s*- \[([ x])\]/)) {
        const childResult = this.parseTask(lines, i, section);
        if (childResult.task) {
          childResult.task.parentId = task.id;
          task.children!.push(childResult.task);
        }
        i = childResult.nextIndex;
        continue;
      }

      // If it's description
      if (nextLine.trim() && !nextLine.match(/^\s*- \[([ x])\]/)) {
        task.description!.push(nextLine.trim());
      }

      i++;
    }

    return { task, nextIndex: i };
  }

  async writeTasks(tasks: Task[], customSections?: string[]): Promise<void> {
    const existingContent = await Deno.readTextFile(this.filePath);
    const config = this.parseProjectConfig(existingContent);
    const projectInfo = this.parseProjectInfo(existingContent);

    console.debug("existingContent", existingContent);

    let content = `# ${projectInfo.name}\n\n`;

    // Add project description
    if (projectInfo.description && projectInfo.description.length > 0) {
      content += projectInfo.description.join("\n") + "\n\n";
    } else {
      content +=
        "this is a project to track task management using markdown and configurable using `{}`\n\n";
      content += "the configurations:\n\n";
      content += "**tag**: string[]\n";
      content += "**due_date**: Date/Time\n";
      content += "**assignee**: string\n";
      content += "**priority**: 1-5 (High to Low)\n";
      content +=
        "**Effort**: int (number of estimated days to complete the tasks)\n";
      content += "**blocked_by**: taskId[] (so string[])\n";
      content += "**(string)** : is the task id\n";
      content += "**[ ]:** mark a task as completed\n";
      content +=
        "**Children items without [] and (string)**: it is a multiline description of the parent item\n\n\n";
    }

    // Add configuration section
    content += "<!-- Configurations -->\n# Configurations\n\n";
    content += `Start Date: ${
      config.startDate || new Date().toISOString().split("T")[0]
    }\n`;
    if (config.workingDaysPerWeek && config.workingDaysPerWeek !== 5) {
      content += `Working Days: ${config.workingDaysPerWeek}\n`;
    }
    content += "\n";

    if (config.assignees && config.assignees.length > 0) {
      content += "Assignees:\n";
      config.assignees.forEach((assignee) => {
        content += `- ${assignee}\n`;
      });
      content += "\n";
    }

    if (config.tags && config.tags.length > 0) {
      content += "Tags:\n";
      config.tags.forEach((tag) => {
        content += `- ${tag}\n`;
      });
      content += "\n";
    }

    // Add notes section
    // if (projectInfo.notes && projectInfo.notes.length > 0) {
    content += "<!-- Notes -->\n# Notes\n\n";
    for (const note of projectInfo.notes) {
      content += `## ${note.title}\n\n`;
      content += `<!-- id: ${note.id} -->\n`;
      content += `${note.content}\n\n`;
    }
    // }

    // Add goals section
    // if (projectInfo.goals && projectInfo.goals.length > 0) {
    content += "<!-- Goals -->\n# Goals\n\n";
    for (const goal of projectInfo.goals) {
      console.log("Goal", goal);
      content +=
        `## ${goal.title} {type: ${goal.type}; kpi: ${goal.kpi}; start: ${goal.startDate}; end: ${goal.endDate}; status: ${goal.status}}\n\n`;
      content += `<!-- id: ${goal.id} -->\n`;
      if (goal.description) {
        console.log("description", goal.description);
        const line = goal.description.substring(
          0,
          goal.description.indexOf("<!--"),
        );
        console.log("line", line);
        content += `${line}\n\n`;
      }
    }
    // }
    //
    // Add canvas section
    // if (projectInfo.postIts && projectInfo.postIts.length > 0) {
    console.debug("Append canvas line.");
    content += "<!-- Canvas -->\n# Canvas\n\n";
    for (const postIt of projectInfo.postIts) {
      const sizeStr = postIt.size
        ? `; size: {width: ${postIt.size.width}, height: ${postIt.size.height}}`
        : "";
      // For multiline content, use "Post-it" as header and put all content in body
      const hasNewlines = postIt.content.includes("\n");
      const title = hasNewlines ? "Post-it" : postIt.content;
      const bodyContent = hasNewlines ? postIt.content : "";

      content +=
        `## ${title} {color: ${postIt.color}; position: {x: ${postIt.position.x}, y: ${postIt.position.y}}${sizeStr}}\n\n`;
      content += `<!-- id: ${postIt.id} -->\n`;
      if (bodyContent.trim()) {
        content += `${bodyContent}\n\n`;
      } else {
        content += `\n`;
      }
    }
    // }

    // Add mindmap section
    // if (projectInfo.mindmaps && projectInfo.mindmaps.length > 0) {
    content += "<!-- Mindmap -->\n# Mindmap\n\n";
    for (const mindmap of projectInfo.mindmaps) {
      content += `## ${mindmap.title}\n\n`;
      content += `<!-- id: ${mindmap.id} -->\n\n`;

      // Write mindmap nodes as nested list
      const rootNodes = mindmap.nodes.filter((node) => node.level === 0);
      for (const rootNode of rootNodes) {
        content += this.mindmapNodeToMarkdown(rootNode, mindmap.nodes, 0);
      }
      content += "\n";
    }
    // }

    content += "<!-- Board -->\n# Board\n\n";

    // Use custom sections if provided, otherwise get from board
    const sections = customSections || this.getSectionsFromBoard();

    for (const section of sections) {
      content += `## ${section}\n\n`;

      const sectionTasks = tasks.filter((task) =>
        task.section === section && !task.parentId
      );

      for (const task of sectionTasks) {
        content += this.taskToMarkdown(task, 0);
      }

      content += "\n";
    }

    await Deno.writeTextFile(this.filePath, content);
  }

  private taskToMarkdown(task: Task, indentLevel: number): string {
    const indent = "  ".repeat(indentLevel);
    const checkbox = task.completed ? "[x]" : "[ ]";
    const idPart = task.id ? ` (${task.id})` : "";

    let configStr = "";
    if (Object.keys(task.config).length > 0) {
      const configParts: string[] = [];
      if (task.config.tag) {
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
      if (task.config.effort) configParts.push(`effort: ${task.config.effort}`);
      if (task.config.blocked_by && task.config.blocked_by.length > 0) {
        configParts.push(`blocked_by: [${task.config.blocked_by.join(", ")}]`);
      }
      if (task.config.milestone) {
        configParts.push(`milestone: ${task.config.milestone}`);
      }
      if (configParts.length > 0) {
        configStr = ` {${configParts.join("; ")}}`;
      }
    }

    let result = `${indent}- ${checkbox}${idPart} ${task.title}${configStr}\n`;

    // Add description
    if (task.description && task.description.length > 0) {
      for (const desc of task.description) {
        result += `${indent}  ${desc}\n`;
      }
    }

    // Add children
    if (task.children && task.children.length > 0) {
      for (const child of task.children) {
        result += this.taskToMarkdown(child, indentLevel + 1);
      }
    }

    return result;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
    const tasks = await this.readTasks();
    const updatedTasks = this.updateTaskInList(tasks, taskId, updates);
    if (updatedTasks) {
      await this.writeTasks(updatedTasks);
      return true;
    }
    return false;
  }

  private updateTaskInList(
    tasks: Task[],
    taskId: string,
    updates: Partial<Task>,
  ): Task[] | null {
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === taskId) {
        // Preserve children and other important properties that shouldn't be overwritten
        const preservedChildren = tasks[i].children;
        const preservedParentId = tasks[i].parentId;

        tasks[i] = {
          ...tasks[i],
          ...updates,
          // Always preserve these properties unless explicitly being updated
          children: updates.children !== undefined
            ? updates.children
            : preservedChildren,
          parentId: updates.parentId !== undefined
            ? updates.parentId
            : preservedParentId,
        };
        return tasks;
      }
      if (tasks[i].children && tasks[i].children!.length > 0) {
        const updatedChildren = this.updateTaskInList(
          tasks[i].children!,
          taskId,
          updates,
        );
        if (updatedChildren) {
          tasks[i].children = updatedChildren;
          return tasks;
        }
      }
    }
    return null;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const tasks = await this.readTasks();
    const filteredTasks = this.deleteTaskFromList(tasks, taskId);
    if (
      filteredTasks.length !== tasks.length ||
      this.hasDeletedChild(tasks, filteredTasks)
    ) {
      await this.writeTasks(filteredTasks);
      return true;
    }
    return false;
  }

  private deleteTaskFromList(tasks: Task[], taskId: string): Task[] {
    return tasks.filter((task) => {
      if (task.id === taskId) return false;
      if (task.children && task.children.length > 0) {
        task.children = this.deleteTaskFromList(task.children, taskId);
      }
      return true;
    });
  }

  private hasDeletedChild(original: Task[], filtered: Task[]): boolean {
    for (let i = 0; i < original.length; i++) {
      if (original[i].children && filtered[i].children) {
        if (original[i].children!.length !== filtered[i].children!.length) {
          return true;
        }
        if (
          this.hasDeletedChild(original[i].children!, filtered[i].children!)
        ) return true;
      }
    }
    return false;
  }

  async addTask(task: Omit<Task, "id">): Promise<string> {
    const tasks = await this.readTasks();
    const newTask: Task = {
      ...task,
      id: this.generateNextTaskId(),
    };

    if (task.parentId) {
      this.addChildTask(tasks, task.parentId, newTask);
    } else {
      tasks.push(newTask);
    }

    await this.writeTasks(tasks);
    return newTask.id;
  }

  private addChildTask(
    tasks: Task[],
    parentId: string,
    childTask: Task,
  ): boolean {
    for (const task of tasks) {
      if (task.id === parentId) {
        if (!task.children) task.children = [];
        task.children.push(childTask);
        return true;
      }
      if (
        task.children && this.addChildTask(task.children, parentId, childTask)
      ) {
        return true;
      }
    }
    return false;
  }

  async readProjectConfig(): Promise<ProjectConfig> {
    try {
      const content = await Deno.readTextFile(this.filePath);
      const config = this.parseProjectConfig(content);
      console.log("Parsed config:", config);
      return config;
    } catch (error) {
      console.error("Error reading project config:", error);
      return {
        startDate: new Date().toISOString().split("T")[0],
        workingDaysPerWeek: 5,
        assignees: [],
        tags: [],
        // sections: ["Ideas", "Todo", "In Progress", "Done"],
      };
    }
  }

  private parseProjectConfig(content: string): ProjectConfig {
    const lines = content.split("\n");
    const config: ProjectConfig = {
      startDate: new Date().toISOString().split("T")[0],
      workingDaysPerWeek: 5,
      assignees: [],
      tags: [],
    };

    let inConfigSection = false;
    let currentSection = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === "# Configurations") {
        inConfigSection = true;
        continue;
      }

      if (line.startsWith("# ") && line !== "# Configurations") {
        inConfigSection = false;
        continue;
      }

      if (inConfigSection) {
        if (line.startsWith("Start Date: ")) {
          config.startDate = line.substring(12).trim();
        } else if (line.startsWith("Working Days: ")) {
          config.workingDaysPerWeek = parseInt(line.substring(14).trim()) || 5;
        } else if (line === "Assignees:") {
          currentSection = "assignees";
        } else if (line === "Tags:") {
          currentSection = "tags";
        } else if (line.startsWith("- ") && currentSection) {
          const value = line.substring(2).trim();
          if (currentSection === "assignees") {
            config.assignees!.push(value);
          } else if (currentSection === "tags") {
            config.tags!.push(value);
          }
        } else if (line === "") {
          currentSection = "";
        }
      }
    }

    console.log("Final parsed config:", config);
    return config;
  }

  generateNextTaskId(): string {
    try {
      const content = Deno.readTextFileSync(this.filePath);
      const lines = content.split("\n");
      let maxId = 0;

      // Find all task IDs and get the highest number
      for (const line of lines) {
        const taskMatch = line.match(/^(\s*)- \[([ x])\] \(([^)]+)\)/);
        if (taskMatch) {
          const taskId = taskMatch[3];
          const numericId = parseInt(taskId);
          if (!isNaN(numericId) && numericId > maxId) {
            maxId = numericId;
          }
        }
      }

      return (maxId + 1).toString();
    } catch (error) {
      console.error("Error generating next task ID:", error);
      return "1";
    }
  }

  generateNoteId(): string {
    try {
      const content = Deno.readTextFileSync(this.filePath);
      const noteIdMatches = content.match(/<!-- id: note_(\d+) -->/g) || [];
      const maxId = Math.max(
        0,
        ...noteIdMatches.map((match) => {
          const idMatch = match.match(/note_(\d+)/);
          return idMatch ? parseInt(idMatch[1]) : 0;
        }),
      );
      return `note_${maxId + 1}`;
    } catch {
      return "note_1";
    }
  }

  generateGoalId(): string {
    try {
      const content = Deno.readTextFileSync(this.filePath);
      const goalIdMatches = content.match(/<!-- id: goal_(\d+) -->/g) || [];
      const maxId = Math.max(
        0,
        ...goalIdMatches.map((match) => {
          const idMatch = match.match(/goal_(\d+)/);
          return idMatch ? parseInt(idMatch[1]) : 0;
        }),
      );
      return `goal_${maxId + 1}`;
    } catch {
      return "goal_1";
    }
  }

  generatePostItId(): string {
    try {
      const content = Deno.readTextFileSync(this.filePath);
      const postItIdMatches = content.match(/<!-- id: postit_(\d+) -->/g) || [];
      const maxId = Math.max(
        0,
        ...postItIdMatches.map((match) => {
          const idMatch = match.match(/postit_(\d+)/);
          return idMatch ? parseInt(idMatch[1]) : 0;
        }),
      );
      return `postit_${maxId + 1}`;
    } catch {
      return "postit_1";
    }
  }

  generateMindmapId(): string {
    try {
      const content = Deno.readTextFileSync(this.filePath);
      const mindmapIdMatches = content.match(/<!-- id: mindmap_(\d+) -->/g) ||
        [];
      const maxId = Math.max(
        0,
        ...mindmapIdMatches.map((match) => {
          const idMatch = match.match(/mindmap_(\d+)/);
          return idMatch ? parseInt(idMatch[1]) : 0;
        }),
      );
      return `mindmap_${maxId + 1}`;
    } catch {
      return "mindmap_1";
    }
  }

  getSectionsFromBoard(): string[] {
    try {
      const content = Deno.readTextFileSync(this.filePath);
      const lines = content.split("\n");
      const sections: string[] = [];

      let inBoardSection = false;

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === "# Board") {
          inBoardSection = true;
          continue;
        }

        if (trimmed.startsWith("# ") && trimmed !== "# Board") {
          inBoardSection = false;
          continue;
        }

        if (inBoardSection && trimmed.startsWith("## ")) {
          sections.push(trimmed.substring(3).trim());
        }
      }

      return sections.length > 0
        ? sections
        : ["Ideas", "Todo", "In Progress", "Done"];
    } catch (error) {
      console.error("Error reading sections from board:", error);
      return ["Ideas", "Todo", "In Progress", "Done"];
    }
  }

  async saveProjectConfig(config: ProjectConfig): Promise<boolean> {
    try {
      console.log("saveProjectConfig called with:", config);
      const content = await Deno.readTextFile(this.filePath);
      console.log("Current content length:", content.length);
      const updatedContent = this.updateProjectConfigInMarkdown(
        content,
        config,
      );
      console.log("Updated content length:", updatedContent.length);
      await Deno.writeTextFile(this.filePath, updatedContent);
      console.log("File written successfully");
      return true;
    } catch (error) {
      console.error("Error saving project config:", error);
      return false;
    }
  }

  private updateProjectConfigInMarkdown(
    content: string,
    config: ProjectConfig,
  ): string {
    const lines = content.split("\n");
    const result: string[] = [];
    let inConfigSection = false;
    let configInserted = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === "# Configurations") {
        inConfigSection = true;
        result.push(line);
        result.push("");
        result.push(
          `Start Date: ${
            config.startDate || new Date().toISOString().split("T")[0]
          }`,
        );
        if (config.workingDaysPerWeek && config.workingDaysPerWeek !== 5) {
          result.push(`Working Days: ${config.workingDaysPerWeek}`);
        }
        result.push("");

        if (config.assignees && config.assignees.length > 0) {
          result.push("Assignees:");
          // Deduplicate assignees
          const uniqueAssignees = [...new Set(config.assignees)];
          uniqueAssignees.forEach((assignee) => {
            result.push(`- ${assignee}`);
          });
          result.push("");
        }

        if (config.tags && config.tags.length > 0) {
          result.push("Tags:");
          // Deduplicate tags
          const uniqueTags = [...new Set(config.tags)];
          uniqueTags.forEach((tag) => {
            result.push(`- ${tag}`);
          });
          result.push("");
        }

        configInserted = true;

        // Skip existing config content
        while (i + 1 < lines.length && !lines[i + 1].trim().startsWith("# ")) {
          i++;
        }
        continue;
      }

      // If we haven't found a config section and we're at the # Board section, insert config
      if (line.trim() === "# Board" && !configInserted) {
        result.push("# Configurations");
        result.push("");
        result.push(
          `Start Date: ${
            config.startDate || new Date().toISOString().split("T")[0]
          }`,
        );
        if (config.workingDaysPerWeek && config.workingDaysPerWeek !== 5) {
          result.push(`Working Days: ${config.workingDaysPerWeek}`);
        }
        result.push("");

        if (config.assignees && config.assignees.length > 0) {
          result.push("Assignees:");
          // Deduplicate assignees
          const uniqueAssignees = [...new Set(config.assignees)];
          uniqueAssignees.forEach((assignee) => {
            result.push(`- ${assignee}`);
          });
          result.push("");
        }

        if (config.tags && config.tags.length > 0) {
          result.push("Tags:");
          // Deduplicate tags
          const uniqueTags = [...new Set(config.tags)];
          uniqueTags.forEach((tag) => {
            result.push(`- ${tag}`);
          });
          result.push("");
        }

        result.push(line);
        configInserted = true;
        continue;
      }

      result.push(line);
    }

    return result.join("\n");
  }

  async addNote(
    note: Omit<Note, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const projectInfo = await this.readProjectInfo();
    const newNote: Note = {
      ...note,
      id: this.generateNoteId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projectInfo.notes.push(newNote);
    await this.saveProjectInfo(projectInfo);
    return newNote.id;
  }

  async updateNote(
    noteId: string,
    updates: Partial<Omit<Note, "id" | "createdAt">>,
  ): Promise<boolean> {
    const projectInfo = await this.readProjectInfo();
    const noteIndex = projectInfo.notes.findIndex((note) => note.id === noteId);

    if (noteIndex === -1) return false;

    projectInfo.notes[noteIndex] = {
      ...projectInfo.notes[noteIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveProjectInfo(projectInfo);
    return true;
  }

  async deleteNote(noteId: string): Promise<boolean> {
    const projectInfo = await this.readProjectInfo();
    const originalLength = projectInfo.notes.length;
    projectInfo.notes = projectInfo.notes.filter((note) => note.id !== noteId);

    if (projectInfo.notes.length !== originalLength) {
      await this.saveProjectInfo(projectInfo);
      return true;
    }
    return false;
  }

  async addGoal(goal: Omit<Goal, "id">): Promise<string> {
    const projectInfo = await this.readProjectInfo();
    const newGoal: Goal = {
      ...goal,
      id: this.generateGoalId(),
    };

    projectInfo.goals.push(newGoal);
    await this.saveProjectInfo(projectInfo);
    return newGoal.id;
  }

  async updateGoal(
    goalId: string,
    updates: Partial<Omit<Goal, "id">>,
  ): Promise<boolean> {
    const projectInfo = await this.readProjectInfo();
    const goalIndex = projectInfo.goals.findIndex((goal) => goal.id === goalId);

    if (goalIndex === -1) return false;

    projectInfo.goals[goalIndex] = {
      ...projectInfo.goals[goalIndex],
      ...updates,
    };

    await this.saveProjectInfo(projectInfo);
    return true;
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    const projectInfo = await this.readProjectInfo();
    const originalLength = projectInfo.goals.length;
    projectInfo.goals = projectInfo.goals.filter((goal) => goal.id !== goalId);

    if (projectInfo.goals.length !== originalLength) {
      await this.saveProjectInfo(projectInfo);
      return true;
    }
    return false;
  }

  private async addPostItToFile(postIt: PostIt): Promise<void> {
    const content = await Deno.readTextFile(this.filePath);
    const lines = content.split("\n");

    // Find Canvas section
    let canvasIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "<!-- Canvas -->") {
        canvasIndex = i;
        break;
      }
    }

    if (canvasIndex === -1) {
      // No Canvas section, add one at the end before Board
      let boardIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === "<!-- Board -->") {
          boardIndex = i;
          break;
        }
      }

      if (boardIndex === -1) {
        console.debug("No Board section, add at end");
        lines.push("", "<!-- Canvas -->", "# Canvas", "");
        canvasIndex = lines.length - 4;
      } else {
        console.debug("Insert before Board");
        lines.splice(boardIndex, 0, "<!-- Canvas -->", "# Canvas", "", "");
        canvasIndex = boardIndex;
      }
    }

    // Find end of Canvas section to insert new post-it
    let insertIndex = canvasIndex + 2; // Skip "<!-- Canvas -->" and "# Canvas"
    for (let i = insertIndex; i < lines.length; i++) {
      if (lines[i].trim().startsWith("<!--") && !lines[i].includes("id:")) {
        insertIndex = i;
        break;
      }
    }

    // Generate post-it markdown - ALWAYS use "Post-it" as header
    const sizeStr = postIt.size
      ? `; size: {width: ${postIt.size.width}, height: ${postIt.size.height}}`
      : "";

    const postItLines = [
      `## Post-it {color: ${postIt.color}; position: {x: ${postIt.position.x}, y: ${postIt.position.y}}${sizeStr}}`,
      "",
      `<!-- id: ${postIt.id} -->`,
      postIt.content,
      "",
    ];

    lines.splice(insertIndex, 0, ...postItLines);
    await Deno.writeTextFile(this.filePath, lines.join("\n"));
  }

  private async updatePostItInFile(
    postItId: string,
    postIt: PostIt,
  ): Promise<void> {
    const content = await Deno.readTextFile(this.filePath);
    const lines = content.split("\n");

    // Find the post-it by ID
    let postItStart = -1;
    let postItEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      const idMatch = lines[i].trim().match(/<!-- id: (postit_\d+) -->/);
      if (idMatch && idMatch[1] === postItId) {
        // Found the ID comment, now find the header
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].trim().startsWith("## ") && lines[j].includes("{")) {
            postItStart = j;
            break;
          }
        }

        // Find end of this post-it (next post-it or section)
        for (let j = i + 1; j < lines.length; j++) {
          if (
            lines[j].trim().startsWith("## ") ||
            lines[j].trim().startsWith("<!--")
          ) {
            postItEnd = j;
            break;
          }
        }
        if (postItEnd === -1) postItEnd = lines.length;
        break;
      }
    }

    if (postItStart === -1) return; // Post-it not found

    // Generate new post-it markdown - ALWAYS use "Post-it" as header
    const sizeStr = postIt.size
      ? `; size: {width: ${postIt.size.width}, height: ${postIt.size.height}}`
      : "";

    const newPostItLines = [
      `## Post-it {color: ${postIt.color}; position: {x: ${postIt.position.x}, y: ${postIt.position.y}}${sizeStr}}`,
      "",
      `<!-- id: ${postIt.id} -->`,
      postIt.content,
      "",
    ];

    // Replace the old post-it with the new one
    lines.splice(postItStart, postItEnd - postItStart, ...newPostItLines);
    await Deno.writeTextFile(this.filePath, lines.join("\n"));
  }

  private mindmapNodeToMarkdown(
    node: MindmapNode,
    allNodes: MindmapNode[],
    level: number,
  ): string {
    const indent = "  ".repeat(level);
    let result = `${indent}- ${node.text}\n`;

    // Add children
    for (const child of node.children) {
      result += this.mindmapNodeToMarkdown(child, allNodes, level + 1);
    }

    return result;
  }

  private async saveProjectInfo(projectInfo: ProjectInfo): Promise<void> {
    console.log("saveProjectInfo", projectInfo);
    const existingContent = await Deno.readTextFile(this.filePath);
    const config = this.parseProjectConfig(existingContent);
    const tasks = await this.readTasks();

    // Update the content with new project info
    let content = `# ${projectInfo.name}\n`;

    // Add project description (filter out empty lines)
    // if (projectInfo.description && projectInfo.description.length > 0) {
    const cleanDescription = projectInfo.description.filter((line) =>
      line.trim() !== ""
    );
    if (cleanDescription.length > 0) {
      content += "\n" + cleanDescription.join("\n") + "\n";
    }
    // }

    // Add configuration section
    content += "<!-- Configurations -->\n# Configurations\n\n";
    content += `Start Date: ${
      config.startDate || new Date().toISOString().split("T")[0]
    }\n`;
    // if (config.workingDaysPerWeek && config.workingDaysPerWeek !== 5) {
    content += `Working Days: ${config.workingDaysPerWeek ?? 5}\n`;
    // }
    content += "\n";

    // if (config.assignees && config.assignees.length > 0) {
    content += "Assignees:\n";
    config.assignees?.forEach((assignee) => {
      content += `- ${assignee}\n`;
    });
    content += "\n";
    // }

    // if (config.tags && config.tags.length > 0) {
    content += "Tags:\n";
    config.tags?.forEach((tag) => {
      content += `- ${tag}\n`;
    });
    content += "\n";
    // }

    // Add notes section
    // if (projectInfo.notes && projectInfo.notes.length > 0) {
    content += "<!-- Notes -->\n# Notes\n\n";
    for (const note of projectInfo.notes) {
      content += `## ${note.title}\n\n`;
      content += `<!-- id: ${note.id} -->\n`;
      if (note.content && note.content.trim()) {
        content += `${note.content}\n\n`;
      } else {
        content += `\n`;
      }
    }
    // }

    // Add goals section
    // if (projectInfo.goals && projectInfo.goals.length > 0) {
    content += "<!-- Goals -->\n# Goals\n\n";
    for (const goal of projectInfo.goals) {
      content +=
        `## ${goal.title} {type: ${goal.type}; kpi: ${goal.kpi}; start: ${goal.startDate}; end: ${goal.endDate}; status: ${goal.status}}\n\n`;
      content += `<!-- id: ${goal.id} -->\n`;
      if (goal.description && goal.description.trim()) {
        console.log("description", goal.description);
        const line = goal.description.substring(
          0,
          goal.description.indexOf("<!--"),
        );
        console.log("line", line);
        content += `${line}\n\n`;
        // content += `${goal.description}\n\n`;
      } else {
        content += `\n`;
      }
    }
    // }

    // Add canvas section
    // if (projectInfo.postIts && projectInfo.postIts.length > 0) {
    console.debug("Append the canvas line.");
    content += "<!-- Canvas -->\n# Canvas\n\n";
    for (const postIt of projectInfo.postIts) {
      const sizeStr = postIt.size
        ? `; size: {width: ${postIt.size.width}, height: ${postIt.size.height}}`
        : "";
      // For multiline content, use "Post-it" as header and put all content in body
      const hasNewlines = postIt.content.includes("\n");
      const title = hasNewlines ? "Post-it" : postIt.content;
      const bodyContent = hasNewlines ? postIt.content : "";

      content +=
        `## ${title} {color: ${postIt.color}; position: {x: ${postIt.position.x}, y: ${postIt.position.y}}${sizeStr}}\n\n`;
      content += `<!-- id: ${postIt.id} -->\n`;
      if (bodyContent.trim()) {
        content += `${bodyContent}\n\n`;
      } else {
        content += `\n`;
      }
    }
    // }

    // Add mindmap section
    // if (projectInfo.mindmaps && projectInfo.mindmaps.length > 0) {
    content += "<!-- Mindmap -->\n# Mindmap\n\n";
    for (const mindmap of projectInfo.mindmaps) {
      content += `## ${mindmap.title}\n\n`;
      content += `<!-- id: ${mindmap.id} -->\n\n`;

      // Write mindmap nodes as nested list
      const rootNodes = mindmap.nodes.filter((node) => node.level === 0);
      for (const rootNode of rootNodes) {
        content += this.mindmapNodeToMarkdown(rootNode, mindmap.nodes, 0);
      }
      content += "\n";
    }
    // }

    // Add board section
    content += "<!-- Board -->\n# Board\n\n";

    // Get existing board sections (this reads from the current file structure)
    const sections = this.getSectionsFromBoard();

    for (const section of sections) {
      content += `## ${section}\n\n`;

      const sectionTasks = tasks.filter((task) =>
        task.section === section && !task.parentId
      );

      for (const task of sectionTasks) {
        content += this.taskToMarkdown(task, 0);
      }

      content += "\n";
    }

    await Deno.writeTextFile(this.filePath, content);
  }

  async addPostIt(postIt: Omit<PostIt, "id">): Promise<string> {
    const projectInfo = await this.readProjectInfo();
    const newPostIt: PostIt = {
      ...postIt,
      id: this.generatePostItId(),
    };

    projectInfo.postIts.push(newPostIt);
    // Use direct file manipulation for post-its to avoid Canvas regeneration
    await this.addPostItToFile(newPostIt);
    return newPostIt.id;
  }

  async updatePostIt(
    postItId: string,
    updates: Partial<Omit<PostIt, "id">>,
  ): Promise<boolean> {
    const projectInfo = await this.readProjectInfo();
    const postItIndex = projectInfo.postIts.findIndex((postIt) =>
      postIt.id === postItId
    );

    if (postItIndex === -1) return false;

    projectInfo.postIts[postItIndex] = {
      ...projectInfo.postIts[postItIndex],
      ...updates,
    };

    // Use direct file manipulation for post-its to avoid Canvas regeneration
    await this.updatePostItInFile(postItId, projectInfo.postIts[postItIndex]);
    return true;
  }

  async deletePostIt(postItId: string): Promise<boolean> {
    const projectInfo = await this.readProjectInfo();
    const originalLength = projectInfo.postIts.length;
    projectInfo.postIts = projectInfo.postIts.filter((postIt) =>
      postIt.id !== postItId
    );

    if (projectInfo.postIts.length !== originalLength) {
      await this.saveProjectInfo(projectInfo);
      return true;
    }
    return false;
  }

  async addMindmap(mindmap: Omit<Mindmap, "id">): Promise<string> {
    const projectInfo = await this.readProjectInfo();
    const newMindmap: Mindmap = {
      ...mindmap,
      id: this.generateMindmapId(),
    };

    projectInfo.mindmaps.push(newMindmap);
    await this.saveProjectInfo(projectInfo);
    return newMindmap.id;
  }

  async updateMindmap(
    mindmapId: string,
    updates: Partial<Omit<Mindmap, "id">>,
  ): Promise<boolean> {
    const projectInfo = await this.readProjectInfo();
    const mindmapIndex = projectInfo.mindmaps.findIndex((mindmap) =>
      mindmap.id === mindmapId
    );

    if (mindmapIndex === -1) return false;

    projectInfo.mindmaps[mindmapIndex] = {
      ...projectInfo.mindmaps[mindmapIndex],
      ...updates,
    };

    await this.saveProjectInfo(projectInfo);
    return true;
  }

  async deleteMindmap(mindmapId: string): Promise<boolean> {
    const projectInfo = await this.readProjectInfo();
    const originalLength = projectInfo.mindmaps.length;
    projectInfo.mindmaps = projectInfo.mindmaps.filter((mindmap) =>
      mindmap.id !== mindmapId
    );

    if (projectInfo.mindmaps.length !== originalLength) {
      await this.saveProjectInfo(projectInfo);
      return true;
    }
    return false;
  }

  private parseConfigString(configStr: string): Array<[string, string]> {
    const pairs: Array<[string, string]> = [];
    let i = 0;

    while (i < configStr.length) {
      // Find the key (everything before the first ':')
      let keyEnd = configStr.indexOf(":", i);
      if (keyEnd === -1) break;

      const key = configStr.substring(i, keyEnd).trim();
      i = keyEnd + 1;

      // Skip whitespace after ':'
      while (i < configStr.length && configStr[i] === " ") i++;

      // Find the value - handle nested braces
      let value = "";
      let braceCount = 0;
      let valueStart = i;

      while (i < configStr.length) {
        const char = configStr[i];

        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
        } else if (char === ";" && braceCount === 0) {
          // End of this key-value pair
          break;
        }
        i++;
      }

      value = configStr.substring(valueStart, i).trim();
      pairs.push([key, value]);

      // Skip the semicolon
      if (i < configStr.length && configStr[i] === ";") {
        i++;
      }

      // Skip whitespace after ';'
      while (i < configStr.length && configStr[i] === " ") i++;
    }

    return pairs;
  }
}
