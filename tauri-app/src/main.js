const { invoke } = window.__TAURI__.core;

class TaskManager {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.searchQuery = '';
        this.projectInfo = null;
        this.sections = [];
        this.currentView = 'summary';
        this.fileOpened = false;
        this.init();
    }

    async init() {
        this.initDarkMode();
        this.bindEvents();
        await this.loadSections();
        this.switchView('summary');
        this.showWelcomeMessage();
    }

    bindEvents() {
        // File controls
        document.getElementById('openFileBtn').addEventListener('click', () => this.openFile());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // View toggle
        document.getElementById('summaryViewBtn').addEventListener('click', () => this.switchView('summary'));
        document.getElementById('listViewBtn').addEventListener('click', () => this.switchView('list'));
        document.getElementById('boardViewBtn').addEventListener('click', () => this.switchView('board'));
        document.getElementById('timelineViewBtn').addEventListener('click', () => this.switchView('timeline'));
        document.getElementById('notesViewBtn').addEventListener('click', () => this.switchView('notes'));
        document.getElementById('goalsViewBtn').addEventListener('click', () => this.switchView('goals'));
        document.getElementById('configViewBtn').addEventListener('click', () => this.switchView('config'));
        
        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
    }

    openFile() {
        document.getElementById('fileInput').click();
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.md')) {
            try {
                // Get the file path from the file input
                // Note: In browsers, we can't access the full file path for security reasons
                // But Tauri provides access to the actual file system
                const filePath = file.path || file.webkitRelativePath || file.name;
                
                console.log('Attempting to open file:', filePath);
                
                // Try the actual file path first
                await this.loadFileContent(filePath);
                this.fileOpened = true;
                this.hideLoading();
                
            } catch (error) {
                console.error('Error opening file:', error);
                // Fallback to the example file for testing
                try {
                    console.log('Falling back to example file...');
                    await this.loadFileContent("/Users/tgingras/Documents/Projects/@studiowebux/mdplanner/example.md");
                    this.fileOpened = true;
                    this.hideLoading();
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    alert('Error opening file. Make sure the example.md file exists or select a valid markdown file.');
                }
            }
        }
    }

    async loadFileContent(filePath) {
        try {
            console.log('Loading file:', filePath);
            await invoke('open_markdown_file', { filePath: filePath });
            
            await this.loadTasks();
            await this.loadProjectInfo();
        } catch (error) {
            console.error('Error loading file content:', error);
            throw error;
        }
    }

    async loadTasks() {
        if (!this.fileOpened) return;
        
        try {
            const tasks = await invoke('get_tasks');
            this.tasks = tasks;
            this.filteredTasks = tasks;
            this.renderCurrentView();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
            this.filteredTasks = [];
            this.hideLoading();
        }
    }

    async loadProjectInfo() {
        if (!this.fileOpened) return;
        
        try {
            const projectInfo = await invoke('get_project_info');
            this.projectInfo = projectInfo;
            this.renderCurrentView();
        } catch (error) {
            console.error('Error loading project info:', error);
        }
    }

    showWelcomeMessage() {
        if (!this.fileOpened) {
            document.getElementById('projectName').textContent = 'MD Planner';
            document.getElementById('projectDescription').innerHTML = '<p class="text-gray-600 dark:text-gray-400">Please open a markdown file to get started.</p>';
        }
    }

    async loadSections() {
        // For now, use default sections
        this.sections = ['Ideas', 'Todo', 'In Progress', 'Done'];
    }

    switchView(view) {
        // Hide all views
        document.querySelectorAll('[id$="View"]').forEach(el => el.classList.add('hidden'));
        
        // Show selected view
        document.getElementById(view + 'View').classList.remove('hidden');
        
        // Update active button states
        this.updateViewButtons(view);
        
        this.currentView = view;
        this.renderCurrentView();
    }

    updateViewButtons(activeView) {
        // Reset all buttons
        document.querySelectorAll('[id$="ViewBtn"]').forEach(btn => {
            btn.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            btn.classList.add('text-gray-600', 'dark:text-gray-300');
        });

        // Set active button
        const activeBtn = document.getElementById(activeView + 'ViewBtn');
        if (activeBtn) {
            activeBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            activeBtn.classList.remove('text-gray-600', 'dark:text-gray-300');
        }
    }

    renderCurrentView() {
        this.hideLoading();
        
        switch (this.currentView) {
            case 'summary':
                this.renderSummaryView();
                break;
            case 'list':
                this.renderListView();
                break;
            case 'board':
                this.renderBoardView();
                break;
            case 'timeline':
                this.renderTimelineView();
                break;
            case 'notes':
                this.renderNotesView();
                break;
            case 'goals':
                this.renderGoalsView();
                break;
            case 'config':
                this.renderConfigView();
                break;
        }
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    renderSummaryView() {
        // Update project name and description
        if (this.projectInfo) {
            document.getElementById('projectName').textContent = this.projectInfo.name;
            const descElement = document.getElementById('projectDescription');
            if (this.projectInfo.description && this.projectInfo.description.length > 0) {
                descElement.innerHTML = this.projectInfo.description.map(line => `<p>${line}</p>`).join('');
            }
        }

        // Calculate and display task statistics
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('progressPercent').textContent = progressPercent + '%';
        document.getElementById('progressBar').style.width = progressPercent + '%';

        // Section breakdown
        this.renderSectionBreakdown();
    }

    renderSectionBreakdown() {
        const sectionBreakdown = document.getElementById('sectionBreakdown');
        sectionBreakdown.innerHTML = '';

        this.sections.forEach(section => {
            const sectionTasks = this.tasks.filter(task => task.section === section);
            const completed = sectionTasks.filter(task => task.completed).length;
            const total = sectionTasks.length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            const sectionElement = document.createElement('div');
            sectionElement.className = 'flex justify-between items-center';
            sectionElement.innerHTML = `
                <span class="text-sm text-gray-600 dark:text-gray-400">${section}</span>
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">${completed}/${total}</span>
                    <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div class="bg-blue-600 dark:bg-blue-500 h-1 rounded-full" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
            sectionBreakdown.appendChild(sectionElement);
        });
    }

    renderListView() {
        const listContainer = document.getElementById('listContainer');
        listContainer.innerHTML = '';

        if (this.filteredTasks.length === 0) {
            listContainer.innerHTML = '<div class="p-6 text-center text-gray-500 dark:text-gray-400">No tasks found</div>';
            return;
        }

        this.filteredTasks.forEach(task => {
            const taskElement = this.createListTaskElement(task);
            listContainer.appendChild(taskElement);
        });
    }

    createListTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors';
        
        const tagsHtml = task.config.tag ? task.config.tag.map(tag => 
            `<span class="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">${tag}</span>`
        ).join(' ') : '';

        taskElement.innerHTML = `
            <div class="flex items-start space-x-3">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                       class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 ${task.completed ? 'line-through opacity-50' : ''}">${task.title}</h3>
                    </div>
                    <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">${task.section}</span>
                        ${task.config.assignee ? `<span>👤 ${task.config.assignee}</span>` : ''}
                        ${task.config.effort ? `<span>⏱️ ${task.config.effort}d</span>` : ''}
                    </div>
                    ${tagsHtml ? `<div class="mt-2 space-x-1">${tagsHtml}</div>` : ''}
                </div>
            </div>
        `;

        return taskElement;
    }

    renderBoardView() {
        const boardContainer = document.getElementById('boardContainer');
        boardContainer.innerHTML = '';

        this.sections.forEach(section => {
            const sectionTasks = this.filteredTasks.filter(task => task.section === section);
            const columnElement = this.createBoardColumn(section, sectionTasks);
            boardContainer.appendChild(columnElement);
        });
    }

    createBoardColumn(section, tasks) {
        const column = document.createElement('div');
        column.className = 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-w-80';
        
        column.innerHTML = `
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">${section} (${tasks.length})</h3>
            <div class="space-y-3">
                ${tasks.map(task => this.createBoardTaskCard(task)).join('')}
            </div>
        `;

        return column;
    }

    createBoardTaskCard(task) {
        const tagsHtml = task.config.tag ? task.config.tag.map(tag => 
            `<span class="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">${tag}</span>`
        ).join(' ') : '';

        return `
            <div class="task-card bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border dark:border-gray-600 ${task.completed ? 'opacity-50' : ''}">
                <div class="flex items-start justify-between mb-2">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 ${task.completed ? 'line-through' : ''}">${task.title}</h4>
                </div>
                ${task.config.assignee || task.config.effort ? `
                    <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        ${task.config.assignee ? `<span>👤 ${task.config.assignee}</span>` : ''}
                        ${task.config.effort ? `<span>⏱️ ${task.config.effort}d</span>` : ''}
                    </div>
                ` : ''}
                ${tagsHtml ? `<div class="space-x-1 mb-2">${tagsHtml}</div>` : ''}
                <div class="flex items-center justify-between">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                </div>
            </div>
        `;
    }

    // Dark mode
    initDarkMode() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    }

    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    renderTimelineView() {
        const timelineContainer = document.getElementById('timelineContainer');
        timelineContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Timeline view not implemented yet</p>';
    }

    renderNotesView() {
        const notesContainer = document.getElementById('notesContainer');
        
        if (!this.projectInfo || !this.projectInfo.notes || this.projectInfo.notes.length === 0) {
            notesContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No notes found</p>';
            return;
        }

        notesContainer.innerHTML = '';
        
        this.projectInfo.notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg';
            
            noteElement.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">${note.title}</h3>
                <div class="prose prose-gray dark:prose-invert max-w-none">
                    <pre class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">${note.content}</pre>
                </div>
            `;
            
            notesContainer.appendChild(noteElement);
        });
    }

    renderGoalsView() {
        const goalsContainer = document.getElementById('goalsContainer');
        
        if (!this.projectInfo || !this.projectInfo.goals || this.projectInfo.goals.length === 0) {
            goalsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No goals found</p>';
            return;
        }

        goalsContainer.innerHTML = '';
        
        this.projectInfo.goals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = 'mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg';
            
            const statusColor = this.getGoalStatusColor(goal.status);
            
            goalElement.innerHTML = `
                <div class="flex items-start justify-between mb-2">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">${goal.title}</h3>
                    <span class="px-2 py-1 text-xs rounded-full ${statusColor}">${goal.status}</span>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div><span class="font-medium">Type:</span> ${goal.type}</div>
                    <div><span class="font-medium">KPI:</span> ${goal.kpi}</div>
                    <div><span class="font-medium">Start:</span> ${goal.startDate}</div>
                    <div><span class="font-medium">End:</span> ${goal.endDate}</div>
                </div>
                ${goal.description ? `<p class="text-gray-700 dark:text-gray-300">${goal.description}</p>` : ''}
            `;
            
            goalsContainer.appendChild(goalElement);
        });
    }

    getGoalStatusColor(status) {
        switch (status) {
            case 'on-track': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'at-risk': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'late': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'success': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    }

    renderConfigView() {
        const configContainer = document.getElementById('configContainer');
        configContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Configuration view not implemented yet</p>';
    }
}

// Initialize the application when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
    window.taskManager = new TaskManager();
});