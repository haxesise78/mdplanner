use serde::{Deserialize, Serialize};
use std::path::Path;
use regex::Regex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TaskConfig {
    assignee: Option<String>,
    effort: Option<u32>,
    tag: Option<Vec<String>>,
    due_date: Option<String>,
    priority: Option<u32>,
    blocked_by: Option<Vec<String>>,
    milestone: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    id: String,
    title: String,
    completed: bool,
    section: String,
    config: TaskConfig,
    description: Option<Vec<String>>,
    children: Option<Vec<Task>>,
    #[serde(rename = "parentId")]
    parent_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    id: String,
    title: String,
    content: String,
    #[serde(rename = "createdAt")]
    created_at: String,
    #[serde(rename = "updatedAt")]
    updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Goal {
    id: String,
    title: String,
    description: String,
    #[serde(rename = "type")]
    goal_type: String,
    kpi: String,
    #[serde(rename = "startDate")]
    start_date: String,
    #[serde(rename = "endDate")]
    end_date: String,
    status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectInfo {
    name: String,
    description: Vec<String>,
    notes: Vec<Note>,
    goals: Vec<Goal>,
}

static mut CURRENT_FILE_PATH: Option<String> = None;

#[tauri::command]
async fn open_markdown_file(file_path: String) -> Result<bool, String> {
    if !Path::new(&file_path).exists() {
        return Err("File does not exist".to_string());
    }
    
    unsafe {
        CURRENT_FILE_PATH = Some(file_path);
    }
    
    Ok(true)
}

#[tauri::command]
async fn get_tasks() -> Result<Vec<Task>, String> {
    let file_path = unsafe {
        match &CURRENT_FILE_PATH {
            Some(path) => path.clone(),
            None => return Err("No file opened".to_string()),
        }
    };
    
    match std::fs::read_to_string(&file_path) {
        Ok(content) => Ok(parse_tasks_from_markdown(&content)),
        Err(e) => Err(format!("Error reading file: {}", e)),
    }
}

#[tauri::command]
async fn get_project_info() -> Result<ProjectInfo, String> {
    let file_path = unsafe {
        match &CURRENT_FILE_PATH {
            Some(path) => path.clone(),
            None => return Err("No file opened".to_string()),
        }
    };
    
    match std::fs::read_to_string(&file_path) {
        Ok(content) => Ok(parse_project_info_from_markdown(&content)),
        Err(e) => Err(format!("Error reading file: {}", e)),
    }
}

fn parse_tasks_from_markdown(content: &str) -> Vec<Task> {
    let lines: Vec<&str> = content.lines().collect();
    let mut tasks = Vec::new();
    let mut current_section = String::new();
    let mut i = 0;
    
    while i < lines.len() {
        let line = lines[i].trim();
        
        // Parse sections (## Section Name)
        if line.starts_with("## ") {
            current_section = line[3..].trim().to_string();
            i += 1;
            continue;
        }
        
        // Parse tasks (- [ ] or - [x])
        let task_regex = Regex::new(r"^(\s*)- \[([ x])\](?:\s*\(([^)]+)\))?\s*(.+?)(?:\s*\{([^}]+)\})?$").unwrap();
        if let Some(captures) = task_regex.captures(line) {
            if let Some(task) = parse_single_task(&lines, i, &current_section) {
                tasks.push(task.0);
                i = task.1;
                continue;
            }
        }
        
        i += 1;
    }
    
    tasks
}

fn parse_single_task(lines: &[&str], start_index: usize, section: &str) -> Option<(Task, usize)> {
    let line = lines[start_index];
    let task_regex = Regex::new(r"^(\s*)- \[([ x])\](?:\s*\(([^)]+)\))?\s*(.+?)(?:\s*\{([^}]+)\})?$").unwrap();
    
    if let Some(captures) = task_regex.captures(line) {
        let indent = captures.get(1).map(|m| m.as_str()).unwrap_or("").len();
        let completed_char = captures.get(2).map(|m| m.as_str()).unwrap_or(" ");
        let id = captures.get(3).map(|m| m.as_str().to_string()).unwrap_or_else(|| "".to_string());
        let title = captures.get(4).map(|m| m.as_str().to_string()).unwrap_or_else(|| "".to_string());
        let config_str = captures.get(5).map(|m| m.as_str()).unwrap_or("");
        
        let completed = completed_char == "x";
        let config = parse_task_config(config_str);
        
        let task = Task {
            id: if id.is_empty() { generate_task_id() } else { id },
            title,
            completed,
            section: section.to_string(),
            config,
            description: Some(Vec::new()),
            children: Some(Vec::new()),
            parent_id: None,
        };
        
        return Some((task, start_index + 1));
    }
    
    None
}

fn parse_task_config(config_str: &str) -> TaskConfig {
    let mut config = TaskConfig {
        assignee: None,
        effort: None,
        tag: None,
        due_date: None,
        priority: None,
        blocked_by: None,
        milestone: None,
    };
    
    if config_str.is_empty() {
        return config;
    }
    
    let pairs: Vec<&str> = config_str.split(';').collect();
    for pair in pairs {
        let parts: Vec<&str> = pair.split(':').map(|s| s.trim()).collect();
        if parts.len() == 2 {
            let key = parts[0];
            let value = parts[1];
            
            match key {
                "assignee" => config.assignee = Some(value.to_string()),
                "effort" => config.effort = value.parse().ok(),
                "due_date" => config.due_date = Some(value.to_string()),
                "priority" => config.priority = value.parse().ok(),
                "milestone" => config.milestone = Some(value.to_string()),
                "tag" => {
                    let tags_str = value.trim_matches(|c| c == '[' || c == ']');
                    config.tag = Some(tags_str.split(',').map(|s| s.trim().to_string()).collect());
                },
                "blocked_by" => {
                    let blocked_str = value.trim_matches(|c| c == '[' || c == ']');
                    config.blocked_by = Some(blocked_str.split(',').map(|s| s.trim().to_string()).collect());
                },
                _ => {}
            }
        }
    }
    
    config
}

fn parse_project_info_from_markdown(content: &str) -> ProjectInfo {
    let lines: Vec<&str> = content.lines().collect();
    let mut project_name = "Untitled Project".to_string();
    let mut description = Vec::new();
    let mut notes = Vec::new();
    let mut goals = Vec::new();
    let mut i = 0;
    let mut found_first_header = false;
    let mut in_notes_section = false;
    let mut in_goals_section = false;
    let mut in_config_section = false;
    
    while i < lines.len() {
        let line = lines[i].trim();
        
        // Find the first # header (project name)
        if line.starts_with("# ") && !found_first_header {
            project_name = line[2..].trim().to_string();
            found_first_header = true;
            i += 1;
            continue;
        }
        
        // Check section boundaries
        if line == "# Notes" || line == "<!-- Notes -->" {
            in_notes_section = true;
            in_goals_section = false;
            in_config_section = false;
            i += 1;
            continue;
        }
        
        if line == "# Goals" || line == "<!-- Goals -->" {
            in_goals_section = true;
            in_notes_section = false;
            in_config_section = false;
            i += 1;
            continue;
        }
        
        if line == "# Configurations" || line == "<!-- Configurations -->" {
            in_config_section = true;
            in_notes_section = false;
            in_goals_section = false;
            i += 1;
            continue;
        }
        
        // Stop at Board section or other major sections
        if line.starts_with("# ") && !["# Notes", "# Goals", "# Configurations"].contains(&line) && found_first_header {
            break;
        }
        
        // Parse notes
        if in_notes_section && line.starts_with("## ") {
            let note_title = line[3..].trim().to_string();
            i += 1;
            let mut note_content = String::new();
            let mut note_id = format!("note_{}", notes.len() + 1);
            
            while i < lines.len() {
                let content_line = lines[i];
                if content_line.trim().starts_with("## ") || content_line.trim().starts_with("# ") || content_line.trim().starts_with("<!--") {
                    break;
                }
                
                // Check for ID comment
                if content_line.trim().starts_with("<!-- id: ") {
                    if let Some(id_match) = content_line.trim().strip_prefix("<!-- id: ").and_then(|s| s.strip_suffix(" -->")) {
                        note_id = id_match.to_string();
                    }
                } else {
                    note_content.push_str(content_line);
                    note_content.push('\n');
                }
                i += 1;
            }
            
            notes.push(Note {
                id: note_id,
                title: note_title,
                content: note_content.trim().to_string(),
                created_at: "".to_string(),
                updated_at: "".to_string(),
            });
            continue;
        }
        
        // Parse goals
        if in_goals_section && line.starts_with("## ") {
            let goal_regex = Regex::new(r"^## (.+?)\s*\{(.+)\}$").unwrap();
            if let Some(captures) = goal_regex.captures(line) {
                let goal_title = captures.get(1).map(|m| m.as_str().to_string()).unwrap_or_default();
                let config_str = captures.get(2).map(|m| m.as_str()).unwrap_or("");
                
                i += 1;
                let mut goal_description = String::new();
                let mut goal_id = format!("goal_{}", goals.len() + 1);
                
                while i < lines.len() {
                    let content_line = lines[i];
                    if content_line.trim().starts_with("## ") || content_line.trim().starts_with("# ") || content_line.trim().starts_with("<!--") {
                        break;
                    }
                    
                    // Check for ID comment
                    if content_line.trim().starts_with("<!-- id: ") {
                        if let Some(id_match) = content_line.trim().strip_prefix("<!-- id: ").and_then(|s| s.strip_suffix(" -->")) {
                            goal_id = id_match.to_string();
                        }
                    } else {
                        goal_description.push_str(content_line);
                        goal_description.push('\n');
                    }
                    i += 1;
                }
                
                let goal = parse_goal_config(&goal_title, config_str, &goal_description.trim(), &goal_id);
                goals.push(goal);
                continue;
            }
        }
        
        // Collect description lines
        if found_first_header && !line.is_empty() && !in_config_section && !in_notes_section && !in_goals_section {
            description.push(line.to_string());
        }
        
        i += 1;
    }
    
    ProjectInfo {
        name: project_name,
        description,
        notes,
        goals,
    }
}

fn parse_goal_config(title: &str, config_str: &str, description: &str, id: &str) -> Goal {
    let mut goal = Goal {
        id: id.to_string(),
        title: title.to_string(),
        description: description.to_string(),
        goal_type: "project".to_string(),
        kpi: "".to_string(),
        start_date: "".to_string(),
        end_date: "".to_string(),
        status: "planning".to_string(),
    };
    
    let pairs: Vec<&str> = config_str.split(';').collect();
    for pair in pairs {
        let parts: Vec<&str> = pair.split(':').map(|s| s.trim()).collect();
        if parts.len() == 2 {
            match parts[0] {
                "type" => goal.goal_type = parts[1].to_string(),
                "kpi" => goal.kpi = parts[1].to_string(),
                "start" => goal.start_date = parts[1].to_string(),
                "end" => goal.end_date = parts[1].to_string(),
                "status" => goal.status = parts[1].to_string(),
                _ => {}
            }
        }
    }
    
    goal
}

fn generate_task_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
    format!("task_{}", timestamp)
}

#[tauri::command]
async fn pick_markdown_file() -> Result<String, String> {
    // This will be handled in the frontend with HTML file input
    Ok("".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_tasks, 
            get_project_info, 
            open_markdown_file,
            pick_markdown_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
