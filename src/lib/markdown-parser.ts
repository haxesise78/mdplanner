export interface TaskConfig {
  tag?: string[];
  due_date?: string;
  assignee?: string;
  priority?: number;
  effort?: number;
  blocked_by?: string[];
  milestone?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  section: string;
  config: TaskConfig;
  description?: string[];
  children?: Task[];
  parentId?: string;
}

export interface ProjectInfo {
  name: string;
  description: string[];
}

export interface ProjectConfig {
  startDate?: string;
  workingDaysPerWeek?: number;
  assignees?: string[];
  tags?: string[];
}

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
      return { name: "Untitled Project", description: [] };
    }
  }

  private parseProjectInfo(content: string): ProjectInfo {
    const lines = content.split('\n');
    let projectName = "Untitled Project";
    const description: string[] = [];
    let i = 0;
    let foundFirstHeader = false;
    let inConfigSection = false;

    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Find the first # header (project name)
      if (line.startsWith('# ') && !foundFirstHeader) {
        projectName = line.substring(2).trim();
        foundFirstHeader = true;
        i++;
        continue;
      }

      // Check if we're entering the Configurations section
      if (line === '# Configurations') {
        inConfigSection = true;
        i++;
        continue;
      }

      // Stop at sections like ## or # Board after we've found the first header
      if ((line.startsWith('## ') || (line.startsWith('# ') && line !== '# Configurations')) && foundFirstHeader) {
        break;
      }

      // Skip configuration section content for description
      if (inConfigSection) {
        i++;
        continue;
      }

      // Collect description lines (skip empty lines at the start)
      if (foundFirstHeader && line && !inConfigSection) {
        description.push(line);
      } else if (foundFirstHeader && !line && description.length > 0 && !inConfigSection) {
        // Keep empty lines if we already have content
        description.push('');
      }

      i++;
    }

    return { name: projectName, description };
  }

  private parseMarkdown(content: string): Task[] {
    const lines = content.split('\n');
    const tasks: Task[] = [];
    let currentSection = '';
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Parse sections (## Section Name)
      if (line.startsWith('## ')) {
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

  private parseTask(lines: string[], startIndex: number, section: string): { task: Task | null, nextIndex: number } {
    const line = lines[startIndex];
    let i = startIndex + 1;

    // Extract task info from line
    const taskMatch = line.match(/^(\s*)- \[([ x])\] (?:\(([^)]+)\))?\s*(.+?)(?:\s*\{([^}]+)\})?$/);
    if (!taskMatch) {
      return { task: null, nextIndex: i };
    }

    const [, indent, completedChar, id, title, configStr] = taskMatch;
    const completed = completedChar === 'x';
    const indentLevel = indent.length;

    // Parse config
    const config: TaskConfig = {};
    if (configStr) {
      const configPairs = configStr.split(';');
      for (const pair of configPairs) {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          switch (key) {
            case 'tag':
              config.tag = value.replace(/[\[\]]/g, '').split(',').map(t => t.trim());
              break;
            case 'due_date':
              config.due_date = value;
              break;
            case 'assignee':
              config.assignee = value;
              break;
            case 'priority':
              config.priority = parseInt(value);
              break;
            case 'effort':
              config.effort = parseInt(value);
              break;
            case 'blocked_by':
              config.blocked_by = value.replace(/[\[\]]/g, '').split(',').map(t => t.trim()).filter(t => t);
              break;
            case 'milestone':
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
      children: []
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
    
    let content = `# ${projectInfo.name}\n\n`;
    
    // Add project description
    if (projectInfo.description && projectInfo.description.length > 0) {
      content += projectInfo.description.join('\n') + '\n\n';
    } else {
      content += "this is a project to track task management using markdown and configurable using `{}`\n\n";
      content += "the configurations:\n\n";
      content += "**tag**: string[]\n";
      content += "**due_date**: Date/Time\n";
      content += "**assignee**: string\n";
      content += "**priority**: 1-5 (High to Low)\n";
      content += "**Effort**: int (number of estimated days to complete the tasks)\n";
      content += "**blocked_by**: taskId[] (so string[])\n";
      content += "**(string)** : is the task id\n";
      content += "**[ ]:** mark a task as completed\n";
      content += "**Children items without [] and (string)**: it is a multiline description of the parent item\n\n\n";
    }
    
    // Add configuration section
    content += "# Configurations\n\n";
    content += `Start Date: ${config.startDate || new Date().toISOString().split('T')[0]}\n`;
    if (config.workingDaysPerWeek && config.workingDaysPerWeek !== 5) {
      content += `Working Days: ${config.workingDaysPerWeek}\n`;
    }
    content += "\n";
    
    if (config.assignees && config.assignees.length > 0) {
      content += "Assignees:\n";
      config.assignees.forEach(assignee => {
        content += `- ${assignee}\n`;
      });
      content += "\n";
    }
    
    if (config.tags && config.tags.length > 0) {
      content += "Tags:\n";
      config.tags.forEach(tag => {
        content += `- ${tag}\n`;
      });
      content += "\n";
    }
    
    content += "# Board\n\n";

    // Use custom sections if provided, otherwise get from board
    const sections = customSections || this.getSectionsFromBoard();
    
    for (const section of sections) {
      content += `## ${section}\n\n`;
      
      const sectionTasks = tasks.filter(task => task.section === section && !task.parentId);
      
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
      if (task.config.tag) configParts.push(`tag: [${task.config.tag.join(', ')}]`);
      if (task.config.due_date) configParts.push(`due_date: ${task.config.due_date}`);
      if (task.config.assignee) configParts.push(`assignee: ${task.config.assignee}`);
      if (task.config.priority) configParts.push(`priority: ${task.config.priority}`);
      if (task.config.effort) configParts.push(`effort: ${task.config.effort}`);
      if (task.config.blocked_by && task.config.blocked_by.length > 0) {
        configParts.push(`blocked_by: [${task.config.blocked_by.join(', ')}]`);
      }
      if (task.config.milestone) configParts.push(`milestone: ${task.config.milestone}`);
      if (configParts.length > 0) {
        configStr = ` {${configParts.join('; ')}}`;
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

  private updateTaskInList(tasks: Task[], taskId: string, updates: Partial<Task>): Task[] | null {
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === taskId) {
        // Preserve children and other important properties that shouldn't be overwritten
        const preservedChildren = tasks[i].children;
        const preservedParentId = tasks[i].parentId;
        
        tasks[i] = { 
          ...tasks[i], 
          ...updates,
          // Always preserve these properties unless explicitly being updated
          children: updates.children !== undefined ? updates.children : preservedChildren,
          parentId: updates.parentId !== undefined ? updates.parentId : preservedParentId
        };
        return tasks;
      }
      if (tasks[i].children && tasks[i].children!.length > 0) {
        const updatedChildren = this.updateTaskInList(tasks[i].children!, taskId, updates);
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
    if (filteredTasks.length !== tasks.length || this.hasDeletedChild(tasks, filteredTasks)) {
      await this.writeTasks(filteredTasks);
      return true;
    }
    return false;
  }

  private deleteTaskFromList(tasks: Task[], taskId: string): Task[] {
    return tasks.filter(task => {
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
        if (original[i].children!.length !== filtered[i].children!.length) return true;
        if (this.hasDeletedChild(original[i].children!, filtered[i].children!)) return true;
      }
    }
    return false;
  }

  async addTask(task: Omit<Task, 'id'>): Promise<string> {
    const tasks = await this.readTasks();
    const newTask: Task = {
      ...task,
      id: this.generateNextTaskId()
    };
    
    if (task.parentId) {
      this.addChildTask(tasks, task.parentId, newTask);
    } else {
      tasks.push(newTask);
    }
    
    await this.writeTasks(tasks);
    return newTask.id;
  }

  private addChildTask(tasks: Task[], parentId: string, childTask: Task): boolean {
    for (const task of tasks) {
      if (task.id === parentId) {
        if (!task.children) task.children = [];
        task.children.push(childTask);
        return true;
      }
      if (task.children && this.addChildTask(task.children, parentId, childTask)) {
        return true;
      }
    }
    return false;
  }

  async readProjectConfig(): Promise<ProjectConfig> {
    try {
      const content = await Deno.readTextFile(this.filePath);
      const config = this.parseProjectConfig(content);
      console.log('Parsed config:', config);
      return config;
    } catch (error) {
      console.error('Error reading project config:', error);
      return {
        startDate: new Date().toISOString().split('T')[0],
        workingDaysPerWeek: 5,
        assignees: [],
        tags: [],
        sections: ['Ideas', 'Todo', 'In Progress', 'Done']
      };
    }
  }

  private parseProjectConfig(content: string): ProjectConfig {
    const lines = content.split('\n');
    const config: ProjectConfig = {
      startDate: new Date().toISOString().split('T')[0],
      workingDaysPerWeek: 5,
      assignees: [],
      tags: []
    };
    
    let inConfigSection = false;
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '# Configurations') {
        inConfigSection = true;
        continue;
      }
      
      if (line.startsWith('# ') && line !== '# Configurations') {
        inConfigSection = false;
        continue;
      }
      
      if (inConfigSection) {
        if (line.startsWith('Start Date: ')) {
          config.startDate = line.substring(12).trim();
        } else if (line.startsWith('Working Days: ')) {
          config.workingDaysPerWeek = parseInt(line.substring(14).trim()) || 5;
        } else if (line === 'Assignees:') {
          currentSection = 'assignees';
        } else if (line === 'Tags:') {
          currentSection = 'tags';
        } else if (line.startsWith('- ') && currentSection) {
          const value = line.substring(2).trim();
          if (currentSection === 'assignees') {
            config.assignees!.push(value);
          } else if (currentSection === 'tags') {
            config.tags!.push(value);
          }
        } else if (line === '') {
          currentSection = '';
        }
      }
    }
    
    console.log('Final parsed config:', config);
    return config;
  }

  generateNextTaskId(): string {
    try {
      const content = Deno.readTextFileSync(this.filePath);
      const lines = content.split('\n');
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
      console.error('Error generating next task ID:', error);
      return '1';
    }
  }

  getSectionsFromBoard(): string[] {
    try {
      const content = Deno.readTextFileSync(this.filePath);
      const lines = content.split('\n');
      const sections: string[] = [];
      
      let inBoardSection = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed === '# Board') {
          inBoardSection = true;
          continue;
        }
        
        if (trimmed.startsWith('# ') && trimmed !== '# Board') {
          inBoardSection = false;
          continue;
        }
        
        if (inBoardSection && trimmed.startsWith('## ')) {
          sections.push(trimmed.substring(3).trim());
        }
      }
      
      return sections.length > 0 ? sections : ['Ideas', 'Todo', 'In Progress', 'Done'];
    } catch (error) {
      console.error('Error reading sections from board:', error);
      return ['Ideas', 'Todo', 'In Progress', 'Done'];
    }
  }

  async saveProjectConfig(config: ProjectConfig): Promise<boolean> {
    try {
      console.log('saveProjectConfig called with:', config);
      const content = await Deno.readTextFile(this.filePath);
      console.log('Current content length:', content.length);
      const updatedContent = this.updateProjectConfigInMarkdown(content, config);
      console.log('Updated content length:', updatedContent.length);
      await Deno.writeTextFile(this.filePath, updatedContent);
      console.log('File written successfully');
      return true;
    } catch (error) {
      console.error('Error saving project config:', error);
      return false;
    }
  }

  private updateProjectConfigInMarkdown(content: string, config: ProjectConfig): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let inConfigSection = false;
    let configInserted = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '# Configurations') {
        inConfigSection = true;
        result.push(line);
        result.push('');
        result.push(`Start Date: ${config.startDate || new Date().toISOString().split('T')[0]}`);
        if (config.workingDaysPerWeek && config.workingDaysPerWeek !== 5) {
          result.push(`Working Days: ${config.workingDaysPerWeek}`);
        }
        result.push('');
        
        if (config.assignees && config.assignees.length > 0) {
          result.push('Assignees:');
          // Deduplicate assignees
          const uniqueAssignees = [...new Set(config.assignees)];
          uniqueAssignees.forEach(assignee => {
            result.push(`- ${assignee}`);
          });
          result.push('');
        }
        
        if (config.tags && config.tags.length > 0) {
          result.push('Tags:');
          // Deduplicate tags
          const uniqueTags = [...new Set(config.tags)];
          uniqueTags.forEach(tag => {
            result.push(`- ${tag}`);
          });
          result.push('');
        }
        
        
        configInserted = true;
        
        // Skip existing config content
        while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('# ')) {
          i++;
        }
        continue;
      }
      
      // If we haven't found a config section and we're at the # Board section, insert config
      if (line.trim() === '# Board' && !configInserted) {
        result.push('# Configurations');
        result.push('');
        result.push(`Start Date: ${config.startDate || new Date().toISOString().split('T')[0]}`);
        if (config.workingDaysPerWeek && config.workingDaysPerWeek !== 5) {
          result.push(`Working Days: ${config.workingDaysPerWeek}`);
        }
        result.push('');
        
        if (config.assignees && config.assignees.length > 0) {
          result.push('Assignees:');
          // Deduplicate assignees
          const uniqueAssignees = [...new Set(config.assignees)];
          uniqueAssignees.forEach(assignee => {
            result.push(`- ${assignee}`);
          });
          result.push('');
        }
        
        if (config.tags && config.tags.length > 0) {
          result.push('Tags:');
          // Deduplicate tags
          const uniqueTags = [...new Set(config.tags)];
          uniqueTags.forEach(tag => {
            result.push(`- ${tag}`);
          });
          result.push('');
        }
        
        
        result.push(line);
        configInserted = true;
        continue;
      }
      
      result.push(line);
    }
    
    return result.join('\n');
  }
}