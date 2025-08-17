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

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: "enterprise" | "project";
  kpi: string;
  startDate: string;
  endDate: string;
  status: "planning" | "on-track" | "at-risk" | "late" | "success" | "failed";
}

export interface PostIt {
  id: string;
  content: string;
  color: "yellow" | "pink" | "blue" | "green" | "purple" | "orange";
  position: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface MindmapNode {
  id: string;
  text: string;
  level: number;
  children: MindmapNode[];
  parent?: string;
}

export interface Mindmap {
  id: string;
  title: string;
  nodes: MindmapNode[];
}

export interface ProjectInfo {
  name: string;
  description: string[];
  notes: Note[];
  goals: Goal[];
  postIts: PostIt[];
  mindmaps: Mindmap[];
}

export interface ProjectConfig {
  startDate?: string;
  workingDaysPerWeek?: number;
  assignees?: string[];
  tags?: string[];
}
