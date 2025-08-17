class TaskManager {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.searchQuery = '';
        this.projectInfo = null;
        this.projectConfig = null;
        this.sections = [];
        this.currentView = 'summary';
        this.editingTask = null;
        this.selectedDependencies = [];
        this.notes = [];
        this.goals = [];
        this.activeNote = null;
        this.editingNote = null;
        this.editingGoal = null;
        this.currentGoalFilter = 'all';
        this.noteEditMode = false;
        this.autoSaveTimeout = null;
        this.postIts = [];
        this.mindmaps = [];
        this.selectedPostItColor = 'yellow';
        this.canvasZoom = 1;
        this.canvasOffset = { x: 0, y: 0 };
        this.mindmapZoom = 1;
        this.mindmapOffset = { x: 0, y: 0 };
        this.selectedMindmap = null;
        this.editingMindmap = null;
        this.currentLayout = 'tree';
        this.init();
    }

    async init() {
        this.initDarkMode();
        this.checkTauriEnvironment();
        this.bindEvents();
        await this.loadProjectConfig(); // Load config first
        await this.loadSections(); // Load sections from board
        this.switchView('summary'); // Open on summary page
        this.loadTasks();
    }

    bindEvents() {
        // View toggle - Desktop
        document.getElementById('summaryViewBtn').addEventListener('click', () => this.switchView('summary'));
        document.getElementById('listViewBtn').addEventListener('click', () => this.switchView('list'));
        document.getElementById('boardViewBtn').addEventListener('click', () => this.switchView('board'));
        document.getElementById('timelineViewBtn').addEventListener('click', () => this.switchView('timeline'));
        document.getElementById('notesViewBtn').addEventListener('click', () => this.switchView('notes'));
        document.getElementById('goalsViewBtn').addEventListener('click', () => this.switchView('goals'));
        document.getElementById('configViewBtn').addEventListener('click', () => this.switchView('config'));
        document.getElementById('canvasViewBtn').addEventListener('click', () => this.switchView('canvas'));
        document.getElementById('mindmapViewBtn').addEventListener('click', () => this.switchView('mindmap'));
        
        // Mobile menu toggle
        document.getElementById('mobileMenuToggle').addEventListener('click', () => this.toggleMobileMenu());
        
        // View toggle - Mobile
        document.getElementById('summaryViewBtnMobile').addEventListener('click', () => { this.switchView('summary'); this.closeMobileMenu(); });
        document.getElementById('listViewBtnMobile').addEventListener('click', () => { this.switchView('list'); this.closeMobileMenu(); });
        document.getElementById('boardViewBtnMobile').addEventListener('click', () => { this.switchView('board'); this.closeMobileMenu(); });
        document.getElementById('timelineViewBtnMobile').addEventListener('click', () => { this.switchView('timeline'); this.closeMobileMenu(); });
        document.getElementById('notesViewBtnMobile').addEventListener('click', () => { this.switchView('notes'); this.closeMobileMenu(); });
        document.getElementById('goalsViewBtnMobile').addEventListener('click', () => { this.switchView('goals'); this.closeMobileMenu(); });
        document.getElementById('configViewBtnMobile').addEventListener('click', () => { this.switchView('config'); this.closeMobileMenu(); });
        document.getElementById('canvasViewBtnMobile').addEventListener('click', () => { this.switchView('canvas'); this.closeMobileMenu(); });
        document.getElementById('mindmapViewBtnMobile').addEventListener('click', () => { this.switchView('mindmap'); this.closeMobileMenu(); });
        
        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
        
        // Add task - Desktop and Mobile
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('addTaskBtnMobile').addEventListener('click', () => { this.openTaskModal(); this.closeMobileMenu(); });
        
        // File operations - Desktop and Mobile (only in Tauri)
        const openFileBtn = document.getElementById('openFileBtn');
        const openFileBtnMobile = document.getElementById('openFileBtnMobile');
        if (openFileBtn) {
            openFileBtn.addEventListener('click', () => this.openFile());
        }
        if (openFileBtnMobile) {
            openFileBtnMobile.addEventListener('click', () => { this.openFile(); this.closeMobileMenu(); });
        }
        
        // Modal events
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        
        // Project config events
        document.getElementById('saveProjectConfig').addEventListener('click', () => this.saveProjectConfig());
        
        // Dependency autocomplete events
        document.getElementById('taskBlockedBy').addEventListener('input', (e) => this.handleDependencyInput(e));
        document.getElementById('taskBlockedBy').addEventListener('keydown', (e) => this.handleDependencyKeydown(e));
        document.addEventListener('click', (e) => this.handleDependencyDocumentClick(e));
        
        // Section management events
        document.getElementById('addSectionBtn').addEventListener('click', () => this.addSection());
        document.getElementById('newSectionInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addSection();
            }
        });
        
        // Assignee management events
        document.getElementById('addAssigneeBtn').addEventListener('click', () => this.addAssignee());
        document.getElementById('newAssigneeInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addAssignee();
            }
        });
        
        // Tag management events
        document.getElementById('addTagBtn').addEventListener('click', () => this.addTag());
        document.getElementById('newTagInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag();
            }
        });
        
        // Working days select in timeline view
        document.getElementById('timelineWorkingDays').addEventListener('change', (e) => {
            this.updateWorkingDays(parseInt(e.target.value));
        });
        
        // Search functionality - Desktop and Mobile
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        document.getElementById('searchInputMobile').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // Close modal on background click
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                this.closeTaskModal();
            }
        });

        // Notes events
        document.getElementById('addNoteBtn').addEventListener('click', () => this.openNoteModal());
        document.getElementById('cancelNoteBtn').addEventListener('click', () => this.closeNoteModal());
        document.getElementById('noteForm').addEventListener('submit', (e) => this.handleNoteSubmit(e));
        document.getElementById('toggleEditBtn').addEventListener('click', () => this.toggleNoteEditMode());
        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteCurrentNote());
        
        // Auto-save events for note editing
        document.getElementById('activeNoteTitle').addEventListener('input', () => this.scheduleAutoSave());
        document.getElementById('activeNoteEditor').addEventListener('input', () => this.scheduleAutoSave());
        
        // Goals events
        document.getElementById('addGoalBtn').addEventListener('click', () => this.openGoalModal());
        document.getElementById('cancelGoalBtn').addEventListener('click', () => this.closeGoalModal());
        document.getElementById('goalForm').addEventListener('submit', (e) => this.handleGoalSubmit(e));
        
        // Goal filters
        document.getElementById('allGoalsFilter').addEventListener('click', () => this.filterGoals('all'));
        document.getElementById('enterpriseGoalsFilter').addEventListener('click', () => this.filterGoals('enterprise'));
        document.getElementById('projectGoalsFilter').addEventListener('click', () => this.filterGoals('project'));
        
        // Canvas events
        document.getElementById('addPostItBtn').addEventListener('click', () => this.openPostItModal());
        document.getElementById('cancelPostItBtn').addEventListener('click', () => this.closePostItModal());
        document.getElementById('postItForm').addEventListener('submit', (e) => this.handlePostItSubmit(e));
        document.getElementById('canvasZoom').addEventListener('input', (e) => this.updateCanvasZoom(e.target.value));
        
        // Mindmap events
        document.getElementById('addMindmapBtn').addEventListener('click', () => this.openMindmapModal());
        document.getElementById('cancelMindmapBtn').addEventListener('click', () => this.closeMindmapModal());
        document.getElementById('mindmapForm').addEventListener('submit', (e) => this.handleMindmapSubmit(e));
        document.getElementById('mindmapSelector').addEventListener('change', (e) => this.selectMindmap(e.target.value));
        document.getElementById('editMindmapBtn').addEventListener('click', () => this.editSelectedMindmap());
        document.getElementById('deleteMindmapBtn').addEventListener('click', () => this.deleteSelectedMindmap());
        document.getElementById('mindmapZoom').addEventListener('input', (e) => this.updateMindmapZoom(e.target.value));
        document.getElementById('mindmapLayout').addEventListener('change', (e) => this.updateMindmapLayout(e.target.value));
        
        // Color picker events for post-it modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-option')) {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedPostItColor = e.target.dataset.color;
            }
        });
        
        // Modal close on background click
        document.getElementById('noteModal').addEventListener('click', (e) => {
            if (e.target.id === 'noteModal') {
                this.closeNoteModal();
            }
        });
        
        document.getElementById('goalModal').addEventListener('click', (e) => {
            if (e.target.id === 'goalModal') {
                this.closeGoalModal();
            }
        });
        
        document.getElementById('postItModal').addEventListener('click', (e) => {
            if (e.target.id === 'postItModal') {
                this.closePostItModal();
            }
        });
        
        document.getElementById('mindmapModal').addEventListener('click', (e) => {
            if (e.target.id === 'mindmapModal') {
                this.closeMindmapModal();
            }
        });

        // Setup drag and drop for board view
        this.setupDragAndDrop();
    }

    async loadTasks() {
        document.getElementById('loading').classList.remove('hidden');
        try {
            const response = await fetch('/api/tasks');
            this.tasks = await response.json();
            this.filteredTasks = this.tasks; // Initialize filtered tasks
            this.renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            document.getElementById('loading').classList.add('hidden');
        }
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        const summaryBtn = document.getElementById('summaryViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        const boardBtn = document.getElementById('boardViewBtn');
        const timelineBtn = document.getElementById('timelineViewBtn');
        const notesBtn = document.getElementById('notesViewBtn');
        const goalsBtn = document.getElementById('goalsViewBtn');
        const canvasBtn = document.getElementById('canvasViewBtn');
        const mindmapBtn = document.getElementById('mindmapViewBtn');
        const configBtn = document.getElementById('configViewBtn');
        
        // Reset all buttons
        [summaryBtn, listBtn, boardBtn, timelineBtn, notesBtn, goalsBtn, canvasBtn, mindmapBtn, configBtn].forEach(btn => {
            btn.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            btn.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100');
        });
        
        // Hide all views
        document.getElementById('summaryView').classList.add('hidden');
        document.getElementById('listView').classList.add('hidden');
        document.getElementById('boardView').classList.add('hidden');
        document.getElementById('timelineView').classList.add('hidden');
        document.getElementById('notesView').classList.add('hidden');
        document.getElementById('goalsView').classList.add('hidden');
        document.getElementById('canvasView').classList.add('hidden');
        document.getElementById('mindmapView').classList.add('hidden');
        document.getElementById('configView').classList.add('hidden');
        
        // Activate current view
        if (view === 'summary') {
            summaryBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            summaryBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100');
            document.getElementById('summaryView').classList.remove('hidden');
            this.loadProjectInfo();
        } else if (view === 'list') {
            listBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            listBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100');
            document.getElementById('listView').classList.remove('hidden');
        } else if (view === 'board') {
            boardBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            boardBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100');
            document.getElementById('boardView').classList.remove('hidden');
        } else if (view === 'timeline') {
            timelineBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            timelineBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100');
            document.getElementById('timelineView').classList.remove('hidden');
            this.renderTimelineView();
        } else if (view === 'notes') {
            notesBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            notesBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100');
            document.getElementById('notesView').classList.remove('hidden');
            this.loadNotes();
        } else if (view === 'goals') {
            goalsBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            goalsBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100');
            document.getElementById('goalsView').classList.remove('hidden');
            this.loadGoals();
        } else if (view === 'canvas') {
            canvasBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            canvasBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100');
            document.getElementById('canvasView').classList.remove('hidden');
            this.loadCanvas();
        } else if (view === 'mindmap') {
            mindmapBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            mindmapBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100');
            document.getElementById('mindmapView').classList.remove('hidden');
            this.loadMindmaps();
        } else if (view === 'config') {
            configBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-gray-100', 'shadow-sm');
            configBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100');
            document.getElementById('configView').classList.remove('hidden');
            this.renderConfigView();
        }
        
        this.renderTasks();
    }

    renderTasks() {
        if (this.currentView === 'list') {
            this.renderListView();
        } else if (this.currentView === 'board') {
            this.renderBoardView();
        } else if (this.currentView === 'summary') {
            this.renderSummaryView();
        }
    }

    async loadProjectInfo() {
        try {
            const response = await fetch('/api/project');
            this.projectInfo = await response.json();
            this.renderSummaryView();
        } catch (error) {
            console.error('Error loading project info:', error);
        }
    }

    renderSummaryView() {
        if (!this.projectInfo) return;
        
        // Update project name and description
        document.getElementById('projectName').textContent = this.projectInfo.name;
        const descriptionEl = document.getElementById('projectDescription');
        
        if (this.projectInfo.description && this.projectInfo.description.length > 0) {
            const markdownText = this.projectInfo.description.join('\n');
            descriptionEl.innerHTML = this.markdownToHtml(markdownText);
        } else {
            descriptionEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">No project description available.</p>';
        }
        
        // Calculate task statistics
        const stats = this.calculateTaskStats();
        
        // Update task counts
        document.getElementById('totalTasks').textContent = stats.total;
        document.getElementById('completedTasks').textContent = stats.completed;
        
        // Update dynamic section counts
        this.renderDynamicSectionCounts(stats.allTasks);
        
        // Update section breakdown dynamically
        this.renderSectionBreakdown();
        
        // Update milestone breakdown
        this.renderMilestoneBreakdown(stats.allTasks);
        
        // Update progress bar
        const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        document.getElementById('progressPercent').textContent = `${progressPercent}%`;
        document.getElementById('progressBar').style.width = `${progressPercent}%`;
    }
    
    renderDynamicSectionCounts(allTasks) {
        const container = document.getElementById('dynamicSectionCounts');
        container.innerHTML = '';
        
        const sections = this.sections || [];
        const colors = ['blue', 'orange', 'purple', 'indigo', 'pink', 'yellow', 'red', 'gray'];
        
        sections.forEach((section, index) => {
            const sectionTasks = allTasks.filter(task => task.section === section && !task.completed);
            const color = colors[index % colors.length];
            
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center';
            div.innerHTML = `
                <span class="text-sm text-gray-600 dark:text-gray-400">${section}</span>
                <span class="text-lg font-semibold text-${color}-600 dark:text-${color}-400">${sectionTasks.length}</span>
            `;
            container.appendChild(div);
        });
    }

    calculateTaskStats() {
        // Count all tasks including children
        let allTasks = [];
        
        const addTasksRecursively = (tasks) => {
            for (const task of tasks) {
                allTasks.push(task);
                if (task.children && task.children.length > 0) {
                    addTasksRecursively(task.children);
                }
            }
        };
        
        addTasksRecursively(this.tasks);
        
        return {
            total: allTasks.length,
            completed: allTasks.filter(t => t.completed).length,
            allTasks: allTasks // Return all tasks for section breakdown
        };
    }
    
    renderSectionBreakdown() {
        const container = document.getElementById('sectionBreakdown');
        const sections = this.sections || [];
        const colors = ['purple', 'orange', 'blue', 'green', 'indigo', 'pink', 'yellow', 'red'];
        
        // Get all tasks including children
        let allTasks = [];
        const addTasksRecursively = (tasks) => {
            for (const task of tasks) {
                allTasks.push(task);
                if (task.children && task.children.length > 0) {
                    addTasksRecursively(task.children);
                }
            }
        };
        addTasksRecursively(this.tasks);
        
        container.innerHTML = '';
        
        sections.forEach((section, index) => {
            const color = colors[index % colors.length];
            const count = allTasks.filter(task => task.section === section).length;
            
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between';
            div.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-${color}-400 rounded-full"></div>
                    <span class="text-sm text-gray-600 dark:text-gray-400">${section}</span>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">${count}</span>
            `;
            container.appendChild(div);
        });
    }

    renderMilestoneBreakdown(allTasks) {
        const milestonesSection = document.getElementById('milestonesSection');
        const container = document.getElementById('milestoneBreakdown');
        
        // Find all unique milestones from tasks
        const milestoneData = {};
        
        allTasks.forEach(task => {
            if (task.config.milestone) {
                const milestone = task.config.milestone;
                if (!milestoneData[milestone]) {
                    milestoneData[milestone] = {
                        total: 0,
                        incomplete: 0
                    };
                }
                milestoneData[milestone].total++;
                if (!task.completed) {
                    milestoneData[milestone].incomplete++;
                }
            }
        });
        
        const milestones = Object.keys(milestoneData);
        
        // Show/hide milestones section based on whether we have milestones
        if (milestones.length === 0) {
            milestonesSection.classList.add('hidden');
            return;
        }
        
        milestonesSection.classList.remove('hidden');
        container.innerHTML = '';
        
        const colors = ['green', 'blue', 'purple', 'orange', 'indigo', 'pink', 'yellow', 'red'];
        
        milestones.sort().forEach((milestone, index) => {
            const data = milestoneData[milestone];
            const color = colors[index % colors.length];
            const completedCount = data.total - data.incomplete;
            const progressPercent = data.total > 0 ? Math.round((completedCount / data.total) * 100) : 0;
            
            const div = document.createElement('div');
            div.className = 'space-y-2';
            div.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-${color}-400 rounded-full"></div>
                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">🏁 ${milestone}</span>
                    </div>
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">${data.incomplete} remaining</span>
                </div>
                <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>${completedCount}/${data.total} completed</span>
                    <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div class="bg-${color}-400 h-1.5 rounded-full transition-all duration-300" style="width: ${progressPercent}%"></div>
                    </div>
                    <span>${progressPercent}%</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    renderListView() {
        const container = document.getElementById('listContainer');
        container.innerHTML = '';

        // Group tasks by section
        const sections = this.sections || [];
        
        if (sections.length === 0) {
            container.innerHTML = '<div class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No sections found. Please add sections to your markdown board with "## Section Name".</div>';
            return;
        }
        
        sections.forEach(section => {
            const tasksToRender = this.getTasksToRender();
            const sectionTasks = tasksToRender.filter(task => task.section === section && !task.parentId);
            
            // Add section separator (always show, even if empty)
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 list-section-header';
            sectionHeader.dataset.section = section;
            sectionHeader.innerHTML = `
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">${section}</h3>
                    <span class="text-xs text-gray-500 dark:text-gray-400">${sectionTasks.length} task${sectionTasks.length !== 1 ? 's' : ''}</span>
                </div>
            `;
            container.appendChild(sectionHeader);

            // Add empty state if no tasks
            if (sectionTasks.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'px-6 py-8 text-center text-gray-400 dark:text-gray-500 text-sm border-b border-gray-100 dark:border-gray-700 list-drop-zone';
                emptyState.dataset.section = section;
                emptyState.innerHTML = `
                    <div class="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg py-6">
                        Drop tasks here or click + to add
                    </div>
                `;
                container.appendChild(emptyState);
            } else {
                // Add tasks in this section
                sectionTasks.forEach(task => {
                    const taskElement = this.createListTaskElement(task);
                    container.appendChild(taskElement);
                    
                    // Add children if any
                    if (task.children && task.children.length > 0) {
                        task.children.forEach(child => {
                            const childElement = this.createListTaskElement(child, true);
                            container.appendChild(childElement);
                        });
                    }
                });
                
                // Add drop zone after existing tasks
                const dropZone = document.createElement('div');
                dropZone.className = 'px-6 py-2 text-center text-gray-400 dark:text-gray-500 text-xs border-b border-gray-100 dark:border-gray-700 list-drop-zone';
                dropZone.dataset.section = section;
                dropZone.innerHTML = `
                    <div class="border border-dashed border-transparent rounded-lg py-2 transition-colors">
                        Drop tasks here
                    </div>
                `;
                container.appendChild(dropZone);
            }
        });
    }

    createListTaskElement(task, isChild = false) {
        const div = document.createElement('div');
        div.className = `task-list-item px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${isChild ? 'pl-12 bg-gray-25 dark:bg-gray-800' : ''} cursor-move border-b border-gray-100 dark:border-gray-700`;
        div.draggable = !isChild; // Only allow parent tasks to be dragged
        div.dataset.taskId = task.id;
        
        const priorityColor = this.getPriorityColor(task.config.priority);
        const priorityText = this.getPriorityText(task.config.priority);
        
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="taskManager.toggleTask('${task.id}')"
                           class="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary dark:bg-gray-700">
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'} font-medium">
                                ${task.title}
                            </span>
                            ${task.config.priority ? `<span class="px-2 py-1 text-xs rounded-full bg-${priorityColor}-100 dark:bg-${priorityColor}-900 text-${priorityColor}-800 dark:text-${priorityColor}-200">${priorityText}</span>` : ''}
                            ${task.config.tag ? task.config.tag.map(tag => `<span class="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">${tag}</span>`).join('') : ''}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            ID: ${task.id} • 
                            ${task.config.assignee ? `Assigned to: ${task.config.assignee} • ` : ''}
                            ${task.config.due_date ? `Due: ${this.formatDate(task.config.due_date)} • ` : ''}
                            ${task.config.effort ? `${task.config.effort} days • ` : ''}
                            ${task.config.milestone ? `Milestone: ${task.config.milestone} • ` : ''}
                            ${task.config.blocked_by && task.config.blocked_by.length > 0 ? `Blocked by: ${task.config.blocked_by.join(', ')} • ` : ''}
                            Section: ${task.section}
                        </div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    ${!isChild ? `
                        <button onclick="taskManager.addSubtask('${task.id}')" 
                                class="text-gray-400 hover:text-green-500 transition-colors" title="Add Subtask">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </button>
                    ` : ''}
                    ${task.description && task.description.length > 0 ? `
                        <button onclick="taskManager.toggleDescription('${task.id}')" 
                                class="text-gray-400 hover:text-blue-500 transition-colors" title="View Description">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </button>
                    ` : ''}
                    <button onclick="taskManager.editTask('${task.id}')" 
                            class="text-gray-400 hover:text-primary transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="taskManager.deleteTask('${task.id}')" 
                            class="text-gray-400 hover:text-red-500 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        return div;
    }

    renderBoardView() {
        const sections = this.sections || [];
        const container = document.getElementById('boardContainer');
        
        if (sections.length === 0) {
            container.className = 'flex items-center justify-center h-64';
            container.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400">No sections found. Please add sections to your markdown board with "## Section Name".</div>';
            return;
        }
        
        // Use flex with horizontal scroll to keep all columns on same row
        container.className = 'flex gap-6 overflow-x-auto pb-4';
        container.innerHTML = '';
        
        sections.forEach(section => {
            const tasksToRender = this.getTasksToRender();
            const sectionTasks = tasksToRender.filter(task => task.section === section && !task.parentId);
            
            // Create column with fixed width for consistent layout
            const column = document.createElement('div');
            column.className = 'bg-white dark:bg-gray-800 rounded-lg shadow flex-shrink-0 w-80';
            column.innerHTML = `
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">${section}</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${sectionTasks.length} tasks</p>
                </div>
                <div class="p-4 min-h-96 space-y-3" data-section="${section}">
                    <!-- Tasks will be populated here -->
                </div>
            `;
            
            const tasksContainer = column.querySelector('[data-section]');
            sectionTasks.forEach(task => {
                const taskCard = this.createBoardTaskElement(task);
                tasksContainer.appendChild(taskCard);
            });
            
            container.appendChild(column);
        });
    }

    createBoardTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-card bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 cursor-move';
        div.draggable = true;
        div.dataset.taskId = task.id;
        
        const priorityColor = this.getPriorityColor(task.config.priority);
        const priorityText = this.getPriorityText(task.config.priority);
        
        div.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <h4 class="${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'} font-medium text-sm">
                    ${task.title}
                </h4>
                <div class="flex space-x-1">
                    <button onclick="taskManager.addSubtask('${task.id}')" 
                            class="text-gray-400 hover:text-green-500 transition-colors" title="Add Subtask">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                    </button>
                    ${task.description && task.description.length > 0 ? `
                        <button onclick="taskManager.toggleDescription('${task.id}')" 
                                class="text-gray-400 hover:text-blue-500 transition-colors" title="View Description">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </button>
                    ` : ''}
                    <button onclick="taskManager.editTask('${task.id}')" 
                            class="text-gray-400 hover:text-primary transition-colors">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="taskManager.deleteTask('${task.id}')" 
                            class="text-gray-400 hover:text-red-500 transition-colors">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="space-y-2">
                <div class="flex items-center space-x-1">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="taskManager.toggleTask('${task.id}')"
                           class="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary dark:bg-gray-600 text-xs">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Complete</span>
                </div>
                
                ${task.config.priority ? `<span class="inline-block px-2 py-1 text-xs rounded-full bg-${priorityColor}-100 dark:bg-${priorityColor}-900 text-${priorityColor}-800 dark:text-${priorityColor}-200">${priorityText}</span>` : ''}
                
                ${task.config.tag ? task.config.tag.map(tag => 
                    `<span class="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mr-1">${tag}</span>`
                ).join('') : ''}
                
                <div class="text-xs text-gray-500 dark:text-gray-400">🔗 ID: ${task.id}</div>
                ${task.config.assignee ? `<div class="text-xs text-gray-500 dark:text-gray-400">👤 ${task.config.assignee}</div>` : ''}
                ${task.config.due_date ? `<div class="text-xs text-gray-500 dark:text-gray-400">📅 ${this.formatDate(task.config.due_date)}</div>` : ''}
                ${task.config.effort ? `<div class="text-xs text-gray-500 dark:text-gray-400">⏱️ ${task.config.effort} days</div>` : ''}
                ${task.config.milestone ? `<div class="text-xs text-gray-500 dark:text-gray-400">🏁 ${task.config.milestone}</div>` : ''}
                ${task.config.blocked_by && task.config.blocked_by.length > 0 ? `<div class="text-xs text-gray-500 dark:text-gray-400">🚫 Blocked by: ${task.config.blocked_by.join(', ')}</div>` : ''}
                
                ${task.children && task.children.length > 0 ? `
                    <div class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-600">
                        <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">📋 Subtasks (${task.children.length})</div>
                        <div class="space-y-1">
                            ${task.children.map(child => `
                                <div class="flex items-center space-x-2 text-xs">
                                    <input type="checkbox" ${child.completed ? 'checked' : ''} 
                                           onchange="taskManager.toggleTask('${child.id}')"
                                           class="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary dark:bg-gray-600" style="transform: scale(0.8);">
                                    <span class="${child.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}">${child.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        return div;
    }

    setupDragAndDrop() {
        // Add drag event listeners to board columns and list drop zones
        document.addEventListener('dragover', (e) => {
            if (e.target.hasAttribute('data-section') || e.target.closest('[data-section]')) {
                this.handleDragOver(e);
            }
        });

        document.addEventListener('drop', (e) => {
            if (e.target.hasAttribute('data-section') || e.target.closest('[data-section]')) {
                this.handleDrop(e);
            }
        });

        document.addEventListener('dragenter', (e) => {
            if (e.target.hasAttribute('data-section') || e.target.closest('[data-section]')) {
                this.handleDragEnter(e);
            }
        });

        document.addEventListener('dragleave', (e) => {
            if (e.target.hasAttribute('data-section') || e.target.closest('[data-section]')) {
                this.handleDragLeave(e);
            }
        });

        // Add drag start/end listeners to task cards and list items
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card') || e.target.classList.contains('task-list-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card') || e.target.classList.contains('task-list-item')) {
                e.target.classList.remove('dragging');
                // Remove drag-over class from all elements
                document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDragEnter(e) {
        e.preventDefault();
        const target = e.target.hasAttribute('data-section') ? e.target : e.target.closest('[data-section]');
        if (target) {
            target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const target = e.target.hasAttribute('data-section') ? e.target : e.target.closest('[data-section]');
        if (target) {
            target.classList.remove('drag-over');
        }
    }

    async handleDrop(e) {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const target = e.target.hasAttribute('data-section') ? e.target : e.target.closest('[data-section]');
        const newSection = target ? target.dataset.section : null;
        
        if (taskId && newSection) {
            target.classList.remove('drag-over');
            await this.moveTask(taskId, newSection);
        }
    }

    async moveTask(taskId, newSection) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/move`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ section: newSection })
            });

            if (response.ok) {
                await this.loadTasks();
            } else {
                console.error('Failed to move task');
            }
        } catch (error) {
            console.error('Error moving task:', error);
        }
    }

    async toggleTask(taskId) {
        const task = this.findTaskById(taskId);
        if (task) {
            try {
                const response = await fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ completed: !task.completed })
                });

                if (response.ok) {
                    await this.loadTasks();
                } else {
                    console.error('Failed to toggle task');
                }
            } catch (error) {
                console.error('Error toggling task:', error);
            }
        }
    }

    findTaskById(id) {
        const findInTasks = (tasks) => {
            for (const task of tasks) {
                if (task.id === id) return task;
                if (task.children) {
                    const found = findInTasks(task.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findInTasks(this.tasks);
    }

    async openTaskModal(task = null, parentTaskId = null) {
        this.editingTask = task;
        this.parentTaskId = parentTaskId;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('modalTitle');
        
        if (parentTaskId) {
            const parentTask = this.findTaskById(parentTaskId);
            title.textContent = `Add Subtask to: ${parentTask.title}`;
        } else {
            title.textContent = task ? 'Edit Task' : 'Add Task';
        }
        
        // Populate form options
        await this.populateFormOptions(task ? task.id : null);
        
        if (task) {
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskSection').value = task.section;
            document.getElementById('taskPriority').value = task.config.priority || '';
            document.getElementById('taskAssignee').value = task.config.assignee || '';
            document.getElementById('taskEffort').value = task.config.effort || '';
            document.getElementById('taskDueDate').value = this.formatDateForInput(task.config.due_date) || '';
            document.getElementById('taskMilestone').value = task.config.milestone || '';
            
            // Set selected tags
            const tagSelect = document.getElementById('taskTags');
            Array.from(tagSelect.options).forEach(option => {
                option.selected = task.config.tag && task.config.tag.includes(option.value);
            });
            
            // Set selected dependencies
            this.selectedDependencies = task.config.blocked_by ? [...task.config.blocked_by] : [];
            this.updateSelectedDependencies();
            
            document.getElementById('taskDescription').value = task.description ? task.description.join('\n') : '';
        } else {
            form.reset();
            this.selectedDependencies = [];
            this.updateSelectedDependencies();
            // If creating a subtask, inherit parent's section
            if (parentTaskId) {
                const parentTask = this.findTaskById(parentTaskId);
                document.getElementById('taskSection').value = parentTask.section;
            }
        }
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        this.editingTask = null;
        this.parentTaskId = null;
    }

    async handleTaskSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('taskTitle').value,
            section: document.getElementById('taskSection').value,
            completed: false,
            config: {
                priority: document.getElementById('taskPriority').value ? parseInt(document.getElementById('taskPriority').value) : undefined,
                assignee: document.getElementById('taskAssignee').value || undefined,
                effort: document.getElementById('taskEffort').value ? parseInt(document.getElementById('taskEffort').value) : undefined,
                due_date: document.getElementById('taskDueDate').value || undefined,
                milestone: document.getElementById('taskMilestone').value || undefined,
                tag: this.getSelectedTags(),
                blocked_by: this.selectedDependencies.length > 0 ? this.selectedDependencies : undefined,
            },
            description: document.getElementById('taskDescription').value ? document.getElementById('taskDescription').value.split('\n') : undefined,
            children: [],
            parentId: this.parentTaskId || undefined
        };

        try {
            let response;
            if (this.editingTask) {
                response = await fetch(`/api/tasks/${this.editingTask.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            }

            if (response.ok) {
                await this.loadTasks();
                this.closeTaskModal();
            } else {
                console.error('Failed to save task');
            }
        } catch (error) {
            console.error('Error saving task:', error);
        }
    }

    async editTask(taskId) {
        const task = this.findTaskById(taskId);
        if (task) {
            await this.openTaskModal(task);
        }
    }

    async addSubtask(parentTaskId) {
        const parentTask = this.findTaskById(parentTaskId);
        if (parentTask) {
            await this.openTaskModal(null, parentTaskId);
        }
    }

    toggleDescription(taskId) {
        const task = this.findTaskById(taskId);
        if (!task || !task.description || task.description.length === 0) return;

        // Create or toggle description modal
        let modal = document.getElementById('descriptionModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'descriptionModal';
            modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 id="descriptionModalTitle" class="text-lg font-medium text-gray-900 dark:text-gray-100">Task Description</h3>
                        <button onclick="taskManager.closeDescriptionModal()" class="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="p-6">
                        <div id="descriptionContent" class="prose prose-gray dark:prose-invert max-w-none"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeDescriptionModal();
                }
            });
        }

        // Update content
        document.getElementById('descriptionModalTitle').textContent = `${task.title} - Description`;
        const markdownText = task.description.join('\n');
        document.getElementById('descriptionContent').innerHTML = this.markdownToHtml(markdownText);

        modal.classList.remove('hidden');
    }

    closeDescriptionModal() {
        const modal = document.getElementById('descriptionModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(`/api/tasks/${taskId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await this.loadTasks();
                } else {
                    console.error('Failed to delete task');
                }
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    }

    getPriorityColor(priority) {
        switch (priority) {
            case 1: return 'red';
            case 2: return 'orange';
            case 3: return 'yellow';
            case 4: return 'blue';
            case 5: return 'gray';
            default: return 'gray';
        }
    }

    getPriorityText(priority) {
        switch (priority) {
            case 1: return 'Highest';
            case 2: return 'High';
            case 3: return 'Medium';
            case 4: return 'Low';
            case 5: return 'Lowest';
            default: return '';
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            // Handle various date formats
            let date;
            
            // If it's just a date (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                date = new Date(dateString + 'T00:00:00');
            }
            // If it's incomplete datetime (YYYY-MM-DDTHH)
            else if (/^\d{4}-\d{2}-\d{2}T\d{1,2}$/.test(dateString)) {
                date = new Date(dateString + ':00:00');
            }
            // If it's incomplete datetime (YYYY-MM-DDTHH:MM)
            else if (/^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}$/.test(dateString)) {
                date = new Date(dateString + ':00');
            }
            // Otherwise try to parse as-is
            else {
                date = new Date(dateString);
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return dateString; // Return original string if can't parse
            }
            
            return date.toLocaleDateString();
        } catch (error) {
            console.warn('Error parsing date:', dateString, error);
            return dateString; // Return original string on error
        }
    }

    formatDateForInput(dateString) {
        if (!dateString) return '';
        
        try {
            let date;
            
            // If it's just a date (YYYY-MM-DD), convert to datetime for input
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString + 'T09:00'; // Default to 9 AM
            }
            // If it's incomplete datetime (YYYY-MM-DDTHH)
            else if (/^\d{4}-\d{2}-\d{2}T\d{1,2}$/.test(dateString)) {
                return dateString.padEnd(13, '0') + ':00'; // Pad and add minutes
            }
            // If it's incomplete datetime (YYYY-MM-DDTHH:MM)
            else if (/^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}$/.test(dateString)) {
                return dateString; // Already in correct format
            }
            // If it's full datetime (YYYY-MM-DDTHH:MM:SS)
            else if (/^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}:\d{2}/.test(dateString)) {
                return dateString.substring(0, 16); // Remove seconds
            }
            // Try to parse and format
            else {
                date = new Date(dateString);
                if (!isNaN(date.getTime())) {
                    // Format as YYYY-MM-DDTHH:MM
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                }
            }
            
            return dateString; // Return original if can't process
        } catch (error) {
            console.warn('Error formatting date for input:', dateString, error);
            return dateString;
        }
    }

    toggleDarkMode() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        
        if (isDark) {
            html.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        } else {
            html.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        }
    }

    initDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDark)) {
            document.documentElement.classList.add('dark');
        }
    }

    markdownToHtml(markdown) {
        if (!markdown) return '';
        
        // Simple markdown to HTML converter
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>');
        
        // Code (inline)
        html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Simple line processing for better text wrapping
        html = html.split('\n').map(line => {
            const trimmed = line.trim();
            
            // Skip empty lines
            if (!trimmed) {
                return '<br>';
            }
            
            // Handle list items
            if (trimmed.startsWith('- ')) {
                return `<li class="text-gray-700 dark:text-gray-300 mb-1">${trimmed.substring(2)}</li>`;
            }
            
            // Skip already processed HTML
            if (trimmed.startsWith('<')) {
                return trimmed;
            }
            
            // Wrap plain text in paragraphs
            return `<p class="text-gray-700 dark:text-gray-300 mb-2">${trimmed}</p>`;
        }).join('');
        
        // Wrap consecutive list items
        html = html.replace(/(<li[^>]*>.*?<\/li>)+/g, '<ul class="list-disc list-inside mb-3">$&</ul>');
        
        // Clean up consecutive <br> tags
        html = html.replace(/(<br>\s*){2,}/g, '<br>');
        
        return html;
    }

    async populateFormOptions(currentTaskId = null) {
        // Load project config if not already loaded
        if (!this.projectConfig) {
            await this.loadProjectConfig();
        }
        
        // Populate sections
        const sectionSelect = document.getElementById('taskSection');
        sectionSelect.innerHTML = '';
        const sections = this.sections || [];
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.textContent = section;
            sectionSelect.appendChild(option);
        });
        
        // Populate assignees
        const assigneeSelect = document.getElementById('taskAssignee');
        assigneeSelect.innerHTML = '<option value="">Select Assignee</option>';
        if (this.projectConfig && this.projectConfig.assignees) {
            this.projectConfig.assignees.forEach(assignee => {
                const option = document.createElement('option');
                option.value = assignee;
                option.textContent = assignee;
                assigneeSelect.appendChild(option);
            });
        }
        
        // Populate tags
        const tagSelect = document.getElementById('taskTags');
        tagSelect.innerHTML = '';
        if (this.projectConfig && this.projectConfig.tags) {
            this.projectConfig.tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag;
                option.textContent = tag;
                tagSelect.appendChild(option);
            });
        }
        
    }
    
    getSelectedTags() {
        const tagSelect = document.getElementById('taskTags');
        const selected = [];
        Array.from(tagSelect.selectedOptions).forEach(option => {
            selected.push(option.value);
        });
        return selected.length > 0 ? selected : undefined;
    }
    
    handleDependencyInput(e) {
        const input = e.target;
        const dropdown = document.getElementById('dependencyDropdown');
        const searchTerm = input.value.toLowerCase();
        
        if (searchTerm.length === 0) {
            dropdown.classList.add('hidden');
            return;
        }
        
        // Get all available tasks (excluding current task and already selected)
        const allTasks = [];
        const collectTasks = (tasks) => {
            for (const task of tasks) {
                if (task.id !== (this.editingTask?.id) && !this.selectedDependencies.includes(task.id)) {
                    allTasks.push(task);
                }
                if (task.children && task.children.length > 0) {
                    collectTasks(task.children);
                }
            }
        };
        collectTasks(this.tasks);
        
        // Filter tasks based on search term
        const filteredTasks = allTasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) || 
            task.id.toLowerCase().includes(searchTerm)
        );
        
        // Populate dropdown
        dropdown.innerHTML = '';
        if (filteredTasks.length > 0) {
            filteredTasks.forEach(task => {
                const option = document.createElement('div');
                option.className = 'px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0';
                option.innerHTML = `
                    <div class="font-medium text-gray-900 dark:text-gray-100">${task.title}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">${task.id} - ${task.section}</div>
                `;
                option.addEventListener('click', () => {
                    this.addDependency(task.id);
                    input.value = '';
                    dropdown.classList.add('hidden');
                });
                dropdown.appendChild(option);
            });
            dropdown.classList.remove('hidden');
        } else {
            dropdown.classList.add('hidden');
        }
    }
    
    handleDependencyKeydown(e) {
        const dropdown = document.getElementById('dependencyDropdown');
        if (e.key === 'Escape') {
            dropdown.classList.add('hidden');
            e.target.value = '';
        }
    }
    
    handleDependencyDocumentClick(e) {
        const dropdown = document.getElementById('dependencyDropdown');
        const input = document.getElementById('taskBlockedBy');
        if (!dropdown.contains(e.target) && e.target !== input) {
            dropdown.classList.add('hidden');
        }
    }
    
    addDependency(taskId) {
        if (!this.selectedDependencies.includes(taskId)) {
            this.selectedDependencies.push(taskId);
            this.updateSelectedDependencies();
        }
    }
    
    removeDependency(taskId) {
        this.selectedDependencies = this.selectedDependencies.filter(id => id !== taskId);
        this.updateSelectedDependencies();
    }
    
    updateSelectedDependencies() {
        const container = document.getElementById('selectedDependencies');
        container.innerHTML = '';
        
        this.selectedDependencies.forEach(taskId => {
            const task = this.findTaskById(taskId);
            const chip = document.createElement('div');
            chip.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
            chip.innerHTML = `
                <span>${task ? task.title : taskId}</span>
                <button type="button" class="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200" onclick="taskManager.removeDependency('${taskId}')">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            container.appendChild(chip);
        });
    }

    async renderTimelineView() {
        await this.loadProjectConfig();
        this.updateTimelineConfig();
        this.generateTimeline();
    }
    
    async renderConfigView() {
        await this.loadProjectConfig();
        this.renderProjectConfigUI();
        this.updateConfigStats();
    }
    
    updateTimelineConfig() {
        // Show read-only config in timeline view
        document.getElementById('timelineStartDate').value = this.projectConfig?.startDate || '';
        document.getElementById('timelineWorkingDays').value = this.projectConfig?.workingDaysPerWeek || 5;
    }
    
    async updateWorkingDays(workingDays) {
        if (this.projectConfig) {
            this.projectConfig.workingDaysPerWeek = workingDays;
            // Update both UI fields to keep them in sync
            document.getElementById('workingDays').value = workingDays;
            document.getElementById('timelineWorkingDays').value = workingDays;
            await this.saveProjectConfig();
            this.generateTimeline(); // Refresh timeline with new working days
        }
    }
    
    updateConfigStats() {
        // Count all tasks including children
        let allTasks = [];
        const addTasksRecursively = (tasks) => {
            for (const task of tasks) {
                allTasks.push(task);
                if (task.children && task.children.length > 0) {
                    addTasksRecursively(task.children);
                }
            }
        };
        addTasksRecursively(this.tasks);
        
        document.getElementById('configTotalTasks').textContent = allTasks.length;
        document.getElementById('configTotalSections').textContent = this.projectConfig?.sections?.length || 0;
        document.getElementById('configTotalAssignees').textContent = this.projectConfig?.assignees?.length || 0;
        document.getElementById('configTotalTags').textContent = this.projectConfig?.tags?.length || 0;
    }

    async loadProjectConfig() {
        try {
            const response = await fetch('/api/project/config');
            this.projectConfig = await response.json();
            
            // Update UI with loaded config
            document.getElementById('projectStartDate').value = this.projectConfig.startDate || '';
            document.getElementById('workingDays').value = this.projectConfig.workingDaysPerWeek || 5;
            
            // Render config UI if in config or timeline view
            if (this.currentView === 'config') {
                this.renderProjectConfigUI();
                this.updateConfigStats();
            } else if (this.currentView === 'timeline') {
                this.updateTimelineConfig();
            }
        } catch (error) {
            console.error('Error loading project config:', error);
            // Set defaults
            this.projectConfig = {
                startDate: new Date().toISOString().split('T')[0],
                workingDaysPerWeek: 5
            };
            document.getElementById('projectStartDate').value = this.projectConfig.startDate;
            document.getElementById('workingDays').value = this.projectConfig.workingDaysPerWeek;
        }
    }
    
    async loadSections() {
        try {
            const response = await fetch('/api/project/sections');
            this.sections = await response.json();
        } catch (error) {
            console.error('Error loading sections:', error);
            this.sections = ['Ideas', 'Todo', 'In Progress', 'Done'];
        }
    }

    async saveProjectConfig() {
        const config = {
            startDate: document.getElementById('projectStartDate').value,
            workingDaysPerWeek: parseInt(document.getElementById('workingDays').value),
            assignees: this.projectConfig?.assignees || [],
            tags: this.projectConfig?.tags || []
        };

        console.log('Saving config:', config);

        try {
            const response = await fetch('/api/project/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });

            const result = await response.text();
            console.log('Save response:', result);

            if (response.ok) {
                this.projectConfig = config;
                if (this.currentView === 'timeline') {
                    this.generateTimeline();
                }
                // Show success message
                const button = document.getElementById('saveProjectConfig');
                const originalText = button.textContent;
                button.textContent = 'Saved!';
                button.classList.add('bg-green-600');
                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('bg-green-600');
                }, 2000);
            } else {
                console.error('Failed to save project config:', result);
            }
        } catch (error) {
            console.error('Error saving project config:', error);
        }
    }

    generateTimeline() {
        const timelineContent = document.getElementById('timelineContent');
        
        if (!this.projectConfig || !this.projectConfig.startDate) {
            timelineContent.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-8">Please configure project start date first</div>';
            return;
        }

        // Count tasks without effort numbers
        const tasksWithoutEffort = this.getTasksWithoutEffort();
        
        // Calculate task scheduling based on dependencies and effort
        const scheduledTasks = this.calculateTaskSchedule();
        
        let html = '<div class="timeline-chart">';
        
        // Add warning banner if there are tasks without effort
        if (tasksWithoutEffort.length > 0) {
            html += '<div class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">';
            html += '<div class="flex items-center">';
            html += '<svg class="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">';
            html += '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>';
            html += '</svg>';
            html += `<span class="text-sm font-medium text-yellow-800 dark:text-yellow-200">${tasksWithoutEffort.length} task${tasksWithoutEffort.length !== 1 ? 's' : ''} without effort estimates (not shown in timeline)</span>`;
            html += '</div>';
            html += '<div class="mt-2 text-xs text-yellow-700 dark:text-yellow-300">';
            html += 'Tasks missing effort: ' + tasksWithoutEffort.map(t => `${t.title} (${t.id})`).join(', ');
            html += '</div>';
            html += '</div>';
        }
        
        if (scheduledTasks.length === 0) {
            html += '<div class="text-center text-gray-500 dark:text-gray-400 py-8">No tasks with effort estimates found</div>';
        } else {
            html += this.generateTimelineHeader(scheduledTasks);
            html += this.generateTimelineRows(scheduledTasks);
        }
        
        html += '</div>';
        
        timelineContent.innerHTML = html;
    }
    
    getTasksWithoutEffort() {
        const tasksWithoutEffort = [];
        
        const collectTasks = (tasks) => {
            for (const task of tasks) {
                if (!task.config.effort || task.config.effort <= 0) {
                    tasksWithoutEffort.push(task);
                }
                if (task.children && task.children.length > 0) {
                    collectTasks(task.children);
                }
            }
        };
        
        collectTasks(this.tasks);
        return tasksWithoutEffort;
    }

    calculateTaskSchedule() {
        const allTasks = [];
        
        // Collect all tasks with effort estimates
        const collectTasks = (tasks) => {
            for (const task of tasks) {
                if (task.config.effort && task.config.effort > 0 && !task.completed) {
                    allTasks.push(task);
                }
                if (task.children && task.children.length > 0) {
                    collectTasks(task.children);
                }
            }
        };
        
        collectTasks(this.tasks);
        
        const scheduled = new Map(); // taskId -> scheduled task
        const projectStartDate = new Date(this.projectConfig.startDate);
        
        // Recursive function to calculate start date for a task
        const calculateTaskStartDate = (task) => {
            if (scheduled.has(task.id)) {
                return scheduled.get(task.id);
            }
            
            const blockedBy = task.config.blocked_by || [];
            let taskStartDate = new Date(projectStartDate);
            
            if (blockedBy.length > 0) {
                // Find the latest end date among all blocking tasks that are still incomplete
                let latestEndDate = new Date(projectStartDate);
                let hasIncompleteDependencies = false;
                
                for (const depId of blockedBy) {
                    // Find dependency in incomplete tasks with effort
                    const depTask = allTasks.find(t => t.id === depId);
                    if (depTask && depTask.config.effort > 0) {
                        hasIncompleteDependencies = true;
                        const depScheduled = calculateTaskStartDate(depTask);
                        if (depScheduled.endDate > latestEndDate) {
                            latestEndDate = new Date(depScheduled.endDate);
                        }
                    }
                    // Note: Completed dependencies are automatically ignored since they're not in allTasks
                }
                
                // Only adjust start date if there are still incomplete dependencies
                if (hasIncompleteDependencies) {
                    // Start this task the day after the latest blocking task ends
                    taskStartDate = new Date(latestEndDate);
                    taskStartDate.setDate(taskStartDate.getDate() + 1);
                }
                // If all dependencies are completed, task starts at project start date (taskStartDate remains unchanged)
            }
            
            // Handle tasks with no effort but due dates
            let endDate;
            let duration;
            if (!task.config.effort || task.config.effort === 0) {
                if (task.config.due_date) {
                    endDate = new Date(task.config.due_date);
                    taskStartDate = new Date(task.config.due_date);
                    duration = 0;
                } else {
                    endDate = new Date(taskStartDate);
                    duration = 0;
                }
            } else {
                endDate = this.addWorkingDays(taskStartDate, task.config.effort);
                duration = task.config.effort;
            }
            
            const scheduledTask = {
                ...task,
                startDate: taskStartDate,
                endDate,
                duration,
                blockedBy: blockedBy,
                isDueDateOnly: !task.config.effort || task.config.effort === 0
            };
            
            scheduled.set(task.id, scheduledTask);
            return scheduledTask;
        };
        
        // Calculate schedule for all tasks
        const result = [];
        for (const task of allTasks) {
            result.push(calculateTaskStartDate(task));
        }
        
        // Sort to group dependencies visually
        return this.sortTasksForVisualGrouping(result);
    }
    
    sortTasksForVisualGrouping(tasks) {
        // Create a dependency map to understand relationships
        const dependencyMap = new Map(); // taskId -> array of tasks that depend on it
        const dependentMap = new Map();  // taskId -> array of tasks this task depends on
        
        // Build dependency relationships
        tasks.forEach(task => {
            dependentMap.set(task.id, task.config.blocked_by || []);
            
            // For each dependency, add this task to its dependents list
            (task.config.blocked_by || []).forEach(depId => {
                if (!dependencyMap.has(depId)) {
                    dependencyMap.set(depId, []);
                }
                dependencyMap.get(depId).push(task.id);
            });
        });
        
        // Create groups of related tasks
        const groups = [];
        const processed = new Set();
        
        tasks.forEach(task => {
            if (processed.has(task.id)) return;
            
            // Start a new dependency chain
            const group = [];
            const toProcess = [task.id];
            const groupSet = new Set();
            
            while (toProcess.length > 0) {
                const currentId = toProcess.pop();
                if (groupSet.has(currentId)) continue;
                
                groupSet.add(currentId);
                const currentTask = tasks.find(t => t.id === currentId);
                if (currentTask) {
                    group.push(currentTask);
                    processed.add(currentId);
                    
                    // Add dependencies and dependents to the same group
                    const deps = dependentMap.get(currentId) || [];
                    const dependents = dependencyMap.get(currentId) || [];
                    
                    deps.forEach(depId => {
                        if (!groupSet.has(depId)) toProcess.push(depId);
                    });
                    dependents.forEach(depId => {
                        if (!groupSet.has(depId)) toProcess.push(depId);
                    });
                }
            }
            
            // Sort group by start date and dependency order
            group.sort((a, b) => {
                // First sort by start date
                const dateCompare = a.startDate - b.startDate;
                if (dateCompare !== 0) return dateCompare;
                
                // If same start date, put dependencies before dependents
                if (a.config.blocked_by && a.config.blocked_by.includes(b.id)) return 1;
                if (b.config.blocked_by && b.config.blocked_by.includes(a.id)) return -1;
                
                return 0;
            });
            
            groups.push(group);
        });
        
        // Sort groups by earliest start date in each group
        groups.sort((a, b) => {
            const minDateA = Math.min(...a.map(t => t.startDate));
            const minDateB = Math.min(...b.map(t => t.startDate));
            return minDateA - minDateB;
        });
        
        // Flatten groups back into a single array
        return groups.flat();
    }

    addWorkingDays(startDate, days) {
        const result = new Date(startDate);
        const workingDaysPerWeek = this.projectConfig.workingDaysPerWeek || 5;
        let addedDays = 0;
        
        while (addedDays < days) {
            result.setDate(result.getDate() + 1);
            const dayOfWeek = result.getDay();
            
            // Count working days based on configuration
            if (workingDaysPerWeek === 7 || 
                (workingDaysPerWeek === 6 && dayOfWeek !== 0) ||
                (workingDaysPerWeek === 5 && dayOfWeek !== 0 && dayOfWeek !== 6)) {
                addedDays++;
            }
        }
        
        return result;
    }

    generateTimelineHeader(scheduledTasks) {
        if (scheduledTasks.length === 0) return '';
        
        const startDate = new Date(Math.min(...scheduledTasks.map(t => t.startDate)));
        const endDate = new Date(Math.max(...scheduledTasks.map(t => t.endDate)));
        
        let html = '<div class="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">';
        html += '<div class="w-48 p-3 font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">Task</div>';
        html += '<div class="flex-1 p-3">';
        html += '<div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">';
        html += `<span>Start: ${startDate.toLocaleDateString()}</span>`;
        html += `<span>End: ${endDate.toLocaleDateString()}</span>`;
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        return html;
    }

    generateTimelineRows(scheduledTasks) {
        if (scheduledTasks.length === 0) return '';
        
        const projectStart = new Date(Math.min(...scheduledTasks.map(t => t.startDate)));
        const projectEnd = new Date(Math.max(...scheduledTasks.map(t => t.endDate)));
        const totalDays = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24)) + 1;
        
        let html = '';
        
        scheduledTasks.forEach(task => {
            const startOffset = Math.ceil((task.startDate - projectStart) / (1000 * 60 * 60 * 24));
            const duration = Math.ceil((task.endDate - task.startDate) / (1000 * 60 * 60 * 24)) + 1;
            const widthPercent = (duration / totalDays) * 100;
            const leftPercent = (startOffset / totalDays) * 100;
            
            const priorityColor = this.getPriorityColor(task.config.priority);
            
            // Check if task is overdue
            const isOverdue = task.config.due_date && task.endDate > new Date(task.config.due_date);
            const taskBarColor = isOverdue ? 'red' : priorityColor;
            
            html += '<div class="flex border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">';
            html += `<div class="w-48 p-3 border-r border-gray-200 dark:border-gray-700">`;
            html += `<div class="font-medium text-gray-900 dark:text-gray-100 text-sm">${task.title}</div>`;
            html += `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: ${task.id}</div>`;
            html += `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">`;
            html += `${task.config.effort} days • ${task.section}`;
            if (task.config.due_date) {
                const dueDate = new Date(task.config.due_date);
                const isOverdue = task.endDate > dueDate;
                html += ` • Due: ${dueDate.toLocaleDateString()}`;
                if (isOverdue) {
                    html += ` <span class="text-red-600 dark:text-red-400 font-medium">⚠️ OVERDUE</span>`;
                }
            }
            if (task.config.blocked_by && task.config.blocked_by.length > 0) {
                html += ` • Blocked by: ${task.config.blocked_by.join(', ')}`;
            }
            html += `</div>`;
            html += `</div>`;
            html += `<div class="flex-1 p-3 relative">`;
            
            // Add dependency arrows if task is blocked
            if (task.config.blocked_by && task.config.blocked_by.length > 0) {
                task.config.blocked_by.forEach(depId => {
                    const depTask = scheduledTasks.find(t => t.id === depId);
                    if (depTask) {
                        const depEndOffset = Math.ceil((depTask.endDate - projectStart) / (1000 * 60 * 60 * 24));
                        const depEndPercent = (depEndOffset / totalDays) * 100;
                        
                        // Draw arrow from dependency end to task start
                        const arrowLength = leftPercent - depEndPercent;
                        if (arrowLength > 0) {
                            html += `<div class="absolute h-0.5 bg-red-400 dark:bg-red-500" style="left: ${depEndPercent}%; width: ${arrowLength}%; top: 50%; z-index: 10;">`;
                            html += `<div class="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1">`;
                            html += `<svg class="w-3 h-3 text-red-400 dark:text-red-500" fill="currentColor" viewBox="0 0 20 20">`;
                            html += `<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>`;
                            html += `</svg>`;
                            html += `</div>`;
                            html += `<div class="absolute left-1/2 -top-5 transform -translate-x-1/2 text-xs text-red-600 dark:text-red-400 font-medium">${depId}</div>`;
                            html += `</div>`;
                        }
                    }
                });
            }
            
            html += `<div class="absolute h-6 bg-${taskBarColor}-400 dark:bg-${taskBarColor}-500 rounded border border-${taskBarColor}-500 dark:border-${taskBarColor}-600${isOverdue ? ' animate-pulse' : ''}" style="left: ${leftPercent}%; width: ${widthPercent}%; top: 50%; transform: translateY(-50%); z-index: 20;">`;
            html += `<div class="px-2 py-1 text-xs text-white font-medium truncate">${task.startDate.toLocaleDateString()} - ${task.endDate.toLocaleDateString()}</div>`;
            html += `</div>`;
            
            // Add per-task due date marker
            if (task.config.due_date) {
                // Parse due date properly for different formats
                let dueDate = new Date(task.config.due_date);
                
                // If invalid, try fixing incomplete datetime format like "2025-08-21T22"
                if (isNaN(dueDate.getTime())) {
                    if (task.config.due_date.match(/^\d{4}-\d{2}-\d{2}T\d{1,2}$/)) {
                        dueDate = new Date(task.config.due_date + ':00:00');
                    } else if (task.config.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        dueDate = new Date(task.config.due_date + 'T00:00:00');
                    }
                }
                
                if (!isNaN(dueDate.getTime())) {
                    const dueDateOffset = Math.ceil((dueDate - projectStart) / (1000 * 60 * 60 * 24));
                    const dueDatePercent = (dueDateOffset / totalDays) * 100;
                    
                    if (dueDatePercent >= 0 && dueDatePercent <= 100) {
                        html += `<div class="absolute w-0.5 bg-orange-500 dark:bg-orange-400" style="left: ${dueDatePercent}%; height: 100%; top: 0; z-index: 25;">`;
                        html += `<div class="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-orange-600 dark:text-orange-400 font-medium whitespace-nowrap bg-white dark:bg-gray-800 px-1 rounded">📅 ${dueDate.toLocaleDateString()}</div>`;
                        html += `</div>`;
                    }
                }
            }
            html += `</div>`;
            html += '</div>';
        });
        
        
        return html;
    }

    
    async rewriteTasksWithUpdatedSections() {
        try {
            // Use the dedicated rewrite endpoint to update section headers
            const response = await fetch('/api/project/rewrite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sections: this.sections
                })
            });
            
            if (response.ok) {
                // Reload tasks and sections to reflect changes
                await this.loadTasks();
                await this.loadSections();
            } else {
                console.error('Failed to rewrite tasks with updated sections');
            }
        } catch (error) {
            console.error('Error updating sections in markdown:', error);
        }
    }
    
    renderProjectConfigUI() {
        if (!this.projectConfig) return;
        
        this.renderSections();
        this.renderAssignees();
        this.renderTags();
    }
    
    renderSections() {
        const container = document.getElementById('sectionsContainer');
        container.innerHTML = '';
        
        const sections = this.sections || [];
        sections.forEach((section, index) => {
            const div = document.createElement('div');
            div.className = 'flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border';
            div.innerHTML = `
                <span class="flex-1 text-gray-900 dark:text-gray-100">${section}</span>
                <div class="flex gap-1">
                    ${index > 0 ? `<button onclick="taskManager.moveSectionUp(${index})" class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Move Up">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                        </svg>
                    </button>` : ''}
                    ${index < sections.length - 1 ? `<button onclick="taskManager.moveSectionDown(${index})" class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Move Down">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>` : ''}
                    <button onclick="taskManager.removeSection(${index})" class="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Remove">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    renderAssignees() {
        const container = document.getElementById('assigneesContainer');
        container.innerHTML = '';
        
        const assignees = this.projectConfig.assignees || [];
        assignees.forEach((assignee, index) => {
            const chip = document.createElement('div');
            chip.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
            chip.innerHTML = `
                <span>${assignee}</span>
                <button onclick="taskManager.removeAssignee(${index})" class="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            container.appendChild(chip);
        });
    }
    
    renderTags() {
        const container = document.getElementById('tagsContainer');
        container.innerHTML = '';
        
        const tags = this.projectConfig.tags || [];
        tags.forEach((tag, index) => {
            const chip = document.createElement('div');
            chip.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            chip.innerHTML = `
                <span>${tag}</span>
                <button onclick="taskManager.removeTag(${index})" class="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            container.appendChild(chip);
        });
    }
    
    async addSection() {
        const input = document.getElementById('newSectionInput');
        const sectionName = input.value.trim();
        
        if (sectionName && !this.sections.includes(sectionName)) {
            // Add section to local array
            this.sections.push(sectionName);
            input.value = '';
            this.renderSections();
            this.updateConfigStats();
            
            // Rewrite the markdown file to include the new section
            await this.rewriteTasksWithUpdatedSections();
            
            // Refresh summary view if it's currently active
            if (this.currentView === 'summary') {
                this.renderSummaryView();
            }
        }
    }
    
    async removeSection(index) {
        const remainingSections = this.sections.filter((_, i) => i !== index);
        const targetSection = remainingSections.length > 0 ? remainingSections[0] : 'Backlog';
        
        if (confirm(`Are you sure you want to remove this section? Tasks in this section will be moved to "${targetSection}".`)) {
            const removedSection = this.sections[index];
            this.sections.splice(index, 1);
            
            // Move tasks from removed section to first remaining section or Backlog
            await this.moveTasksFromSection(removedSection, targetSection);
            
            this.renderSections();
            this.updateConfigStats();
            // Rewrite tasks to remove old section headers
            await this.rewriteTasksWithUpdatedSections();
        }
    }
    
    async moveSectionUp(index) {
        if (index > 0) {
            const sections = this.sections;
            [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
            this.renderSections();
            // Rewrite tasks to reorder section headers
            await this.rewriteTasksWithUpdatedSections();
        }
    }
    
    async moveSectionDown(index) {
        const sections = this.sections;
        if (index < sections.length - 1) {
            [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
            this.renderSections();
            // Rewrite tasks to reorder section headers
            await this.rewriteTasksWithUpdatedSections();
        }
    }
    
    async moveTasksFromSection(fromSection, toSection) {
        const tasksToMove = this.tasks.filter(task => task.section === fromSection);
        for (const task of tasksToMove) {
            await this.updateTask(task.id, { section: toSection });
        }
        await this.loadTasks();
    }
    
    async addAssignee() {
        const input = document.getElementById('newAssigneeInput');
        const assigneeName = input.value.trim();
        
        if (assigneeName && !this.projectConfig.assignees.includes(assigneeName)) {
            this.projectConfig.assignees.push(assigneeName);
            input.value = '';
            this.renderAssignees();
            this.updateConfigStats();
            // Auto-save the configuration
            await this.saveProjectConfig();
        }
    }
    
    async removeAssignee(index) {
        this.projectConfig.assignees.splice(index, 1);
        this.renderAssignees();
        this.updateConfigStats();
        // Auto-save the configuration
        await this.saveProjectConfig();
    }
    
    async addTag() {
        const input = document.getElementById('newTagInput');
        const tagName = input.value.trim();
        
        if (tagName && !this.projectConfig.tags.includes(tagName)) {
            this.projectConfig.tags.push(tagName);
            input.value = '';
            this.renderTags();
            this.updateConfigStats();
            // Auto-save the configuration
            await this.saveProjectConfig();
        }
    }
    
    async removeTag(index) {
        this.projectConfig.tags.splice(index, 1);
        this.renderTags();
        this.updateConfigStats();
        // Auto-save the configuration
        await this.saveProjectConfig();
    }
    
    async updateTask(taskId, updates) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });
            return response.ok;
        } catch (error) {
            console.error('Error updating task:', error);
            return false;
        }
    }
    
    handleSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        if (this.searchQuery === '') {
            this.filteredTasks = this.tasks;
        } else {
            this.filteredTasks = this.filterTasksRecursive(this.tasks);
        }
        this.renderTasks();
    }
    
    filterTasksRecursive(tasks) {
        const filtered = [];
        for (const task of tasks) {
            if (this.matchesSearch(task)) {
                // Include the task with all its children if it matches
                filtered.push({
                    ...task,
                    children: task.children || []
                });
            } else if (task.children && task.children.length > 0) {
                // Check if any children match
                const filteredChildren = this.filterTasksRecursive(task.children);
                if (filteredChildren.length > 0) {
                    // Include parent if children match
                    filtered.push({
                        ...task,
                        children: filteredChildren
                    });
                }
            }
        }
        return filtered;
    }
    
    matchesSearch(task) {
        const query = this.searchQuery;
        return (
            task.title.toLowerCase().includes(query) ||
            task.id.toLowerCase().includes(query) ||
            task.section.toLowerCase().includes(query) ||
            (task.config.assignee && task.config.assignee.toLowerCase().includes(query)) ||
            (task.config.milestone && task.config.milestone.toLowerCase().includes(query)) ||
            (task.config.tag && task.config.tag.some(tag => tag.toLowerCase().includes(query))) ||
            (task.description && task.description.some(desc => desc.toLowerCase().includes(query)))
        );
    }
    
    getTasksToRender() {
        return this.searchQuery ? this.filteredTasks : this.tasks;
    }

    // Notes functionality
    async loadNotes() {
        try {
            const response = await fetch('/api/project');
            const projectInfo = await response.json();
            this.notes = projectInfo.notes || [];
            this.renderNotesView();
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
            this.renderNotesView();
        }
    }

    renderNotesView() {
        const tabNav = document.getElementById('notesTabNav');
        const emptyState = document.getElementById('emptyNotesState');
        const activeContent = document.getElementById('activeNoteContent');

        if (this.notes.length === 0) {
            tabNav.innerHTML = '';
            emptyState.classList.remove('hidden');
            activeContent.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        // Render tabs using linear indexing for stable IDs
        tabNav.innerHTML = this.notes.map((note, index) => `
            <button class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                (this.activeNote === null && index === 0) || this.activeNote === index
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }" onclick="taskManager.selectNote(${index})">
                ${note.title}
            </button>
        `).join('');

        // Show first note if none selected
        if (this.activeNote === null && this.notes.length > 0) {
            this.activeNote = 0;
        }

        this.renderActiveNote();
    }

    renderActiveNote() {
        const activeContent = document.getElementById('activeNoteContent');
        const activeNote = this.notes[this.activeNote];
        
        if (!activeNote) {
            activeContent.classList.add('hidden');
            return;
        }

        activeContent.classList.remove('hidden');
        document.getElementById('activeNoteTitle').value = activeNote.title;
        document.getElementById('activeNoteEditor').value = activeNote.content;
        
        this.updateNoteDisplay();
    }

    updateNoteDisplay() {
        const activeNote = this.notes[this.activeNote];
        if (!activeNote) return;

        // Convert markdown-like content to HTML with proper styling
        let htmlContent = this.markdownToHtml(activeNote.content);
        
        // If content is empty or just whitespace, add a fallback
        if (!htmlContent.trim()) {
            htmlContent = '<p class="text-gray-500 dark:text-gray-400 italic">No content</p>';
        }
        
        document.getElementById('activeNoteBody').innerHTML = htmlContent;
    }

    toggleNoteEditMode() {
        this.noteEditMode = !this.noteEditMode;
        const editor = document.getElementById('activeNoteEditor');
        const display = document.getElementById('activeNoteBody');
        const titleInput = document.getElementById('activeNoteTitle');

        if (this.noteEditMode) {
            // Switch to edit mode
            editor.classList.remove('hidden');
            display.classList.add('hidden');
            titleInput.removeAttribute('readonly');
            titleInput.classList.add('border-b', 'border-gray-300', 'dark:border-gray-600');
            editor.focus();
        } else {
            // Switch to view mode
            editor.classList.add('hidden');
            display.classList.remove('hidden');
            titleInput.setAttribute('readonly', 'true');
            titleInput.classList.remove('border-b', 'border-gray-300', 'dark:border-gray-600');
            this.updateNoteDisplay();
        }
    }

    scheduleAutoSave() {
        // Clear existing timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        // Schedule auto-save after 1 second of inactivity
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSaveNote();
        }, 1000);
    }

    async autoSaveNote() {
        if (this.activeNote === null) return;

        const title = document.getElementById('activeNoteTitle').value;
        const content = document.getElementById('activeNoteEditor').value;
        const activeNote = this.notes[this.activeNote];

        // Only save if content has changed
        if (title === activeNote.title && content === activeNote.content) {
            return;
        }

        try {
            // Show saving indicator
            const indicator = document.getElementById('saveIndicator');
            indicator.classList.remove('hidden');

            await fetch(`/api/notes/${activeNote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });

            // Update local data
            this.notes[this.activeNote].title = title;
            this.notes[this.activeNote].content = content;

            // Update display if in view mode
            if (!this.noteEditMode) {
                this.updateNoteDisplay();
            }

            // Update tab title
            this.renderNotesView();

            // Hide indicator after a short delay
            setTimeout(() => {
                indicator.classList.add('hidden');
            }, 1000);

        } catch (error) {
            console.error('Error auto-saving note:', error);
        }
    }

    selectNote(noteIndex) {
        this.activeNote = noteIndex;
        this.renderNotesView();
    }

    openNoteModal() {
        this.editingNote = null;
        document.getElementById('noteModalTitle').textContent = 'Add Note';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteModal').classList.remove('hidden');
        document.getElementById('noteModal').classList.add('flex');
    }

    closeNoteModal() {
        document.getElementById('noteModal').classList.add('hidden');
        document.getElementById('noteModal').classList.remove('flex');
    }

    async handleNoteSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;
        
        try {
            if (this.editingNote !== null) {
                // Update existing note using backend ID
                const note = this.notes[this.editingNote];
                await fetch(`/api/notes/${note.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content })
                });
            } else {
                // Create new note
                await fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content })
                });
            }
            
            this.closeNoteModal();
            await this.loadNotes();
        } catch (error) {
            console.error('Error saving note:', error);
        }
    }


    async deleteCurrentNote() {
        if (this.activeNote === null) return;

        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            const note = this.notes[this.activeNote];
            await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
            this.activeNote = null;
            await this.loadNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    }

    // Goals functionality
    async loadGoals() {
        try {
            const response = await fetch('/api/project');
            const projectInfo = await response.json();
            this.goals = projectInfo.goals || [];
            this.renderGoalsView();
        } catch (error) {
            console.error('Error loading goals:', error);
            this.goals = [];
            this.renderGoalsView();
        }
    }

    renderGoalsView() {
        const container = document.getElementById('goalsContainer');
        const emptyState = document.getElementById('emptyGoalsState');
        
        const filteredGoals = this.getFilteredGoals();

        if (filteredGoals.length === 0) {
            emptyState.classList.remove('hidden');
            container.innerHTML = '';
            return;
        }

        emptyState.classList.add('hidden');
        
        container.innerHTML = filteredGoals.map((goal, index) => `
            <div class="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">${goal.title}</h3>
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getTypeStyle(goal.type)}">
                                ${goal.type}
                            </span>
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getStatusStyle(goal.status)}">
                                ${goal.status}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${goal.description}</p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span class="font-medium text-gray-700 dark:text-gray-300">KPI:</span>
                                <span class="text-gray-600 dark:text-gray-400">${goal.kpi}</span>
                            </div>
                            <div>
                                <span class="font-medium text-gray-700 dark:text-gray-300">Start:</span>
                                <span class="text-gray-600 dark:text-gray-400">${goal.startDate}</span>
                            </div>
                            <div>
                                <span class="font-medium text-gray-700 dark:text-gray-300">End:</span>
                                <span class="text-gray-600 dark:text-gray-400">${goal.endDate}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button onclick="taskManager.editGoal(${this.goals.indexOf(goal)})" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button onclick="taskManager.deleteGoal(${this.goals.indexOf(goal)})" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getFilteredGoals() {
        if (this.currentGoalFilter === 'all') {
            return this.goals;
        }
        return this.goals.filter(goal => goal.type === this.currentGoalFilter);
    }

    getTypeStyle(type) {
        return type === 'enterprise' 
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }

    getStatusStyle(status) {
        const styles = {
            'planning': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
            'on-track': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'at-risk': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            'late': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            'success': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
            'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
        return styles[status] || styles['planning'];
    }

    filterGoals(type) {
        console.log('filterGoals called with type:', type);
        this.currentGoalFilter = type;
        
        // Update filter button styles
        const filters = ['allGoalsFilter', 'enterpriseGoalsFilter', 'projectGoalsFilter'];
        filters.forEach(filterId => {
            const btn = document.getElementById(filterId);
            if ((filterId === 'allGoalsFilter' && type === 'all') ||
                (filterId === 'enterpriseGoalsFilter' && type === 'enterprise') ||
                (filterId === 'projectGoalsFilter' && type === 'project')) {
                btn.className = 'px-3 py-1 rounded-md text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
            } else {
                btn.className = 'px-3 py-1 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100';
            }
        });
        
        console.log('About to render goals with filter:', this.currentGoalFilter);
        this.renderGoalsView();
    }

    openGoalModal() {
        this.editingGoal = null;
        document.getElementById('goalModalTitle').textContent = 'Add Goal';
        document.getElementById('goalTitle').value = '';
        document.getElementById('goalType').value = 'project';
        document.getElementById('goalStatus').value = 'planning';
        document.getElementById('goalKpi').value = '';
        document.getElementById('goalStartDate').value = '';
        document.getElementById('goalEndDate').value = '';
        document.getElementById('goalDescription').value = '';
        document.getElementById('goalModal').classList.remove('hidden');
        document.getElementById('goalModal').classList.add('flex');
    }

    closeGoalModal() {
        document.getElementById('goalModal').classList.add('hidden');
        document.getElementById('goalModal').classList.remove('flex');
    }

    async handleGoalSubmit(e) {
        e.preventDefault();
        
        const goalData = {
            title: document.getElementById('goalTitle').value,
            type: document.getElementById('goalType').value,
            status: document.getElementById('goalStatus').value,
            kpi: document.getElementById('goalKpi').value,
            startDate: document.getElementById('goalStartDate').value,
            endDate: document.getElementById('goalEndDate').value,
            description: document.getElementById('goalDescription').value
        };
        
        try {
            if (this.editingGoal !== null) {
                // Update existing goal using backend ID
                const goal = this.goals[this.editingGoal];
                await fetch(`/api/goals/${goal.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(goalData)
                });
            } else {
                // Create new goal
                await fetch('/api/goals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(goalData)
                });
            }
            
            this.closeGoalModal();
            await this.loadGoals();
            // Force re-render with current filter
            this.renderGoalsView();
        } catch (error) {
            console.error('Error saving goal:', error);
        }
    }

    editGoal(goalIndex) {
        const goal = this.goals[goalIndex];
        if (!goal) return;

        this.editingGoal = goalIndex;
        document.getElementById('goalModalTitle').textContent = 'Edit Goal';
        document.getElementById('goalTitle').value = goal.title;
        document.getElementById('goalType').value = goal.type;
        document.getElementById('goalStatus').value = goal.status;
        document.getElementById('goalKpi').value = goal.kpi;
        document.getElementById('goalStartDate').value = goal.startDate;
        document.getElementById('goalEndDate').value = goal.endDate;
        document.getElementById('goalDescription').value = goal.description;
        document.getElementById('goalModal').classList.remove('hidden');
        document.getElementById('goalModal').classList.add('flex');
    }

    async deleteGoal(goalIndex) {
        if (!confirm('Are you sure you want to delete this goal?')) return;

        try {
            const goal = this.goals[goalIndex];
            await fetch(`/api/goals/${goal.id}`, { method: 'DELETE' });
            await this.loadGoals();
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    }

    // Mobile menu functionality
    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const isHidden = mobileMenu.classList.contains('hidden');
        
        if (isHidden) {
            mobileMenu.classList.remove('hidden');
            // Sync search values
            const searchInput = document.getElementById('searchInput');
            const searchInputMobile = document.getElementById('searchInputMobile');
            searchInputMobile.value = searchInput.value;
        } else {
            mobileMenu.classList.add('hidden');
        }
    }

    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        mobileMenu.classList.add('hidden');
    }

    // Tauri-specific functionality
    checkTauriEnvironment() {
        console.log('=== Tauri Environment Check ===');
        console.log('window.__TAURI__:', window.__TAURI__);
        console.log('window.__TAURI_INTERNALS__:', window.__TAURI_INTERNALS__);
        console.log('window.isTauri:', window.isTauri);
        console.log('User Agent:', navigator.userAgent);
        console.log('Location:', window.location.href);
        
        // Check multiple ways Tauri might be detected
        const hasTauri = window.__TAURI__ || window.__TAURI_INTERNALS__ || window.isTauri;
        
        if (hasTauri) {
            console.log('✅ Tauri detected! Showing file operations.');
            // Show file operations
            const fileOperations = document.getElementById('fileOperations');
            const fileOperationsMobile = document.getElementById('fileOperationsMobile');
            if (fileOperations) {
                fileOperations.classList.remove('hidden');
                console.log('✅ Desktop file operations shown');
            }
            if (fileOperationsMobile) {
                fileOperationsMobile.classList.remove('hidden');
                console.log('✅ Mobile file operations shown');
            }
            
            // Listen for file selection events
            this.setupTauriListeners();
        } else {
            console.log('❌ Tauri NOT detected. Running in web browser.');
            console.log('But we will still show the buttons for testing...');
            
            // For debugging: show buttons anyway
            const fileOperations = document.getElementById('fileOperations');
            const fileOperationsMobile = document.getElementById('fileOperationsMobile');
            if (fileOperations) {
                fileOperations.classList.remove('hidden');
                console.log('🔧 Desktop file operations shown for debugging');
            }
            if (fileOperationsMobile) {
                fileOperationsMobile.classList.remove('hidden');
                console.log('🔧 Mobile file operations shown for debugging');
            }
        }
        
        console.log('=== End Tauri Check ===');
    }

    setupTauriListeners() {
        // Simple approach - call restart directly after file selection
        console.log('Tauri listeners setup - simplified approach');
    }

    async handleFileSelected(filePath) {
        try {
            // Show loading state
            const loading = document.getElementById('loading');
            if (loading) loading.classList.remove('hidden');
            
            // Hide all views
            this.hideAllViews();
            
            // Restart server with new file
            const { invoke } = window.__TAURI_INTERNALS__;
            await invoke('restart_server_with_file', { filePath });
            
            // Wait a moment for server to restart
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Reload all data
            await this.loadProjectConfig();
            await this.loadSections();
            await this.loadTasks();
            await this.loadNotes();
            await this.loadGoals();
            
            // Hide loading and show summary view
            if (loading) loading.classList.add('hidden');
            this.switchView('summary');
            
            // Show success message
            this.showNotification(`Loaded file: ${filePath.split('/').pop()}`, 'success');
            
        } catch (error) {
            console.error('Error loading file:', error);
            this.showNotification('Error loading file: ' + error, 'error');
        }
    }

    hideAllViews() {
        const views = ['summaryView', 'listView', 'boardView', 'timelineView', 'notesView', 'goalsView', 'configView'];
        views.forEach(viewId => {
            const view = document.getElementById(viewId);
            if (view) view.classList.add('hidden');
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    async openFile() {
        console.log('openFile called');
        
        // Check if we're running in Tauri
        if (!window.__TAURI_INTERNALS__) {
            alert('File operations are only available in the desktop app.');
            return;
        }

        try {
            console.log('Attempting to access Tauri invoke...');
            
            // In Tauri 2, we need to access the invoke function through the proper path
            const { invoke } = window.__TAURI_INTERNALS__;
            
            if (!invoke) {
                console.error('Invoke function not found in __TAURI_INTERNALS__');
                console.log('Available keys in __TAURI_INTERNALS__:', Object.keys(window.__TAURI_INTERNALS__));
                alert('Invoke function not available. Check console for details.');
                return;
            }
            
            console.log('Found invoke function, calling select_markdown_file...');
            const result = await invoke('select_markdown_file');
            console.log('select_markdown_file result:', result);
            
        } catch (error) {
            console.error('Error opening file:', error);
            console.error('Error details:', error.message, error.stack);
            alert('Error opening file: ' + error.message);
        }
    }

    // Canvas functionality
    async loadCanvas() {
        try {
            const response = await fetch('/api/canvas/postits');
            this.postIts = await response.json();
            this.renderCanvas();
        } catch (error) {
            console.error('Error loading canvas:', error);
        }
    }

    renderCanvas() {
        const canvasContent = document.getElementById('canvasContent');
        canvasContent.innerHTML = '';
        
        this.postIts.forEach(postIt => {
            const postItElement = this.createPostItElement(postIt);
            canvasContent.appendChild(postItElement);
        });
    }

    createPostItElement(postIt) {
        const element = document.createElement('div');
        element.className = `post-it ${postIt.color}`;
        element.style.left = `${postIt.position.x}px`;
        element.style.top = `${postIt.position.y}px`;
        element.dataset.id = postIt.id;
        
        if (postIt.size) {
            element.style.width = `${postIt.size.width}px`;
            element.style.height = `${postIt.size.height}px`;
        }
        
        element.setAttribute('data-postit-id', postIt.id);
        element.innerHTML = `
            <div class="post-it-controls">
                <button onclick="taskManager.editPostIt('${postIt.id}')">✏️</button>
                <button onclick="taskManager.deletePostIt('${postIt.id}')">🗑️</button>
            </div>
            <div contenteditable="true" onblur="taskManager.updatePostItContent('${postIt.id}', this.innerText)">${postIt.content}</div>
        `;
        
        this.makePostItDraggable(element);
        return element;
    }

    makePostItDraggable(element) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        element.addEventListener('mousedown', (e) => {
            if (e.target.contentEditable === 'true') return;
            isDragging = true;
            element.classList.add('dragging');
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(element.style.left);
            startTop = parseInt(element.style.top);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const newLeft = startLeft + (e.clientX - startX);
            const newTop = startTop + (e.clientY - startY);
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.classList.remove('dragging');
                this.updatePostItPosition(element.dataset.id, {
                    x: parseInt(element.style.left),
                    y: parseInt(element.style.top)
                });
            }
        });
    }

    openPostItModal() {
        document.getElementById('postItModal').classList.remove('hidden');
        document.getElementById('postItModal').classList.add('flex');
        document.getElementById('postItContent').value = '';
        this.selectedPostItColor = 'yellow';
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector('[data-color="yellow"]').classList.add('selected');
    }

    closePostItModal() {
        document.getElementById('postItModal').classList.add('hidden');
        document.getElementById('postItModal').classList.remove('flex');
    }

    async handlePostItSubmit(e) {
        e.preventDefault();
        const content = document.getElementById('postItContent').value;
        
        console.log('Creating post-it with content:', content);
        console.log('Selected color:', this.selectedPostItColor);
        
        if (!content.trim()) {
            alert('Please enter some content for the post-it');
            return;
        }
        
        try {
            const postData = {
                content: content.trim(),
                color: this.selectedPostItColor || 'yellow',
                position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }
            };
            
            console.log('Sending POST request with data:', postData);
            
            const response = await fetch('/api/canvas/postits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Post-it created successfully:', result);
                this.closePostItModal();
                this.loadCanvas();
            } else {
                const error = await response.text();
                console.error('Failed to create post-it:', error);
                alert('Failed to create post-it: ' + error);
            }
        } catch (error) {
            console.error('Error creating post-it:', error);
            alert('Error creating post-it: ' + error.message);
        }
    }

    editPostIt(id) {
        // Find the post-it element and focus on its content area
        const element = document.querySelector(`[data-postit-id="${id}"] div[contenteditable]`);
        if (element) {
            element.focus();
            // Select all text for easy editing
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    async updatePostItContent(id, content) {
        try {
            await fetch(`/api/canvas/postits/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
        } catch (error) {
            console.error('Error updating post-it:', error);
        }
    }

    async updatePostItPosition(id, position) {
        try {
            await fetch(`/api/canvas/postits/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position })
            });
        } catch (error) {
            console.error('Error updating post-it position:', error);
        }
    }

    async deletePostIt(id) {
        if (confirm('Delete this post-it?')) {
            try {
                await fetch(`/api/canvas/postits/${id}`, { method: 'DELETE' });
                this.loadCanvas();
            } catch (error) {
                console.error('Error deleting post-it:', error);
            }
        }
    }


    updateCanvasZoom(value) {
        this.canvasZoom = parseFloat(value);
        const viewport = document.getElementById('canvasViewport');
        viewport.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px) scale(${this.canvasZoom})`;
        document.getElementById('zoomLevel').textContent = `${Math.round(this.canvasZoom * 100)}%`;
    }



    // Mindmap functionality
    async loadMindmaps(autoSelect = true) {
        try {
            const response = await fetch('/api/mindmaps');
            this.mindmaps = await response.json();
            this.renderMindmapSelector();
            if (this.mindmaps.length > 0 && autoSelect) {
                this.selectMindmap(this.mindmaps[0].id);
            } else if (this.mindmaps.length === 0) {
                // No mindmaps available, clear everything
                this.selectedMindmap = null;
                const content = document.getElementById('mindmapContent');
                const emptyState = document.getElementById('mindmapEmptyState');
                const editBtn = document.getElementById('editMindmapBtn');
                const deleteBtn = document.getElementById('deleteMindmapBtn');
                
                if (content) content.innerHTML = '';
                if (emptyState) emptyState.style.display = 'flex';
                if (editBtn) editBtn.style.display = 'none';
                if (deleteBtn) deleteBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading mindmaps:', error);
        }
    }

    renderMindmapSelector() {
        const selector = document.getElementById('mindmapSelector');
        selector.innerHTML = '<option value="">Select Mindmap</option>';
        
        this.mindmaps.forEach(mindmap => {
            const option = document.createElement('option');
            option.value = mindmap.id;
            option.textContent = mindmap.title;
            selector.appendChild(option);
        });
    }

    selectMindmap(mindmapId) {
        // Update the selector value first
        const selector = document.getElementById('mindmapSelector');
        if (selector) {
            selector.value = mindmapId;
        }
        
        if (!mindmapId || mindmapId === "") {
            // No mindmap selected - clear everything
            this.selectedMindmap = null;
            const content = document.getElementById('mindmapContent');
            const emptyState = document.getElementById('mindmapEmptyState');
            const editBtn = document.getElementById('editMindmapBtn');
            const deleteBtn = document.getElementById('deleteMindmapBtn');
            
            if (content) content.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            if (editBtn) editBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
            return;
        }
        
        this.selectedMindmap = this.mindmaps.find(m => m.id === mindmapId);
        
        if (this.selectedMindmap) {
            console.log('Selected mindmap:', this.selectedMindmap.title); // Debug
            this.renderMindmap();
            // Show edit and delete buttons
            const editBtn = document.getElementById('editMindmapBtn');
            const deleteBtn = document.getElementById('deleteMindmapBtn');
            if (editBtn && deleteBtn) {
                editBtn.style.display = 'block';
                deleteBtn.style.display = 'block';
                console.log('Buttons shown'); // Debug
            } else {
                console.log('Buttons not found!'); // Debug
            }
        } else {
            console.log('No mindmap found for ID:', mindmapId); // Debug
            // Mindmap not found
            const content = document.getElementById('mindmapContent');
            const emptyState = document.getElementById('mindmapEmptyState');
            const editBtn = document.getElementById('editMindmapBtn');
            const deleteBtn = document.getElementById('deleteMindmapBtn');
            
            if (content) content.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            if (editBtn) editBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    }

    renderMindmap() {
        const content = document.getElementById('mindmapContent');
        const emptyState = document.getElementById('mindmapEmptyState');
        
        if (!content) {
            console.error('mindmapContent element not found');
            return;
        }
        
        if (!this.selectedMindmap || this.selectedMindmap.nodes.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            return;
        }
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        content.innerHTML = '';
        
        // Make the mindmap draggable
        this.setupMindmapPanning();
        
        // Find root nodes (level 0)
        const rootNodes = this.selectedMindmap.nodes.filter(node => node.level === 0);
        
        if (rootNodes.length === 0) {
            emptyState.style.display = 'flex';
            return;
        }
        
        // Use tree layout
        this.renderTreeLayout(rootNodes, content);
        
        // Draw connections between nodes
        this.drawConnections(content);
    }

    renderTreeLayout(rootNodes, content) {
        const startX = 400;
        const startY = 200;
        const levelSpacing = 200;
        const nodeSpacing = 100;
        
        // Position each root node and its children
        rootNodes.forEach((rootNode, rootIndex) => {
            const rootY = startY + (rootIndex * 300);
            this.positionNodeAndChildren(rootNode, startX, rootY, levelSpacing, nodeSpacing, content);
        });
    }


    createNodeElement(node, x, y, container) {
        const element = document.createElement('div');
        element.className = `mindmap-node level-${node.level}`;
        element.textContent = node.text;
        element.dataset.nodeId = node.id;
        
        if (node.level === 0) {
            element.classList.add('root');
        }
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        container.appendChild(element);
    }
    
    positionNodeAndChildren(node, x, y, levelSpacing, nodeSpacing, container) {
        // Create and position the node element
        const element = document.createElement('div');
        element.className = `mindmap-node level-${node.level}`;
        element.textContent = node.text;
        element.dataset.nodeId = node.id;
        
        if (node.level === 0) {
            element.classList.add('root');
        }
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        container.appendChild(element);
        
        // Store position for drawing connections
        node.x = x;
        node.y = y;
        
        // Position children
        const children = this.selectedMindmap.nodes.filter(n => n.parent === node.id);
        if (children.length > 0) {
            const childStartY = y - ((children.length - 1) * nodeSpacing) / 2;
            
            children.forEach((child, index) => {
                const childX = x + levelSpacing;
                const childY = childStartY + (index * nodeSpacing);
                this.positionNodeAndChildren(child, childX, childY, levelSpacing, nodeSpacing, container);
            });
        }
    }
    
    drawConnections(container) {
        // Draw lines between connected nodes
        this.selectedMindmap.nodes.forEach(node => {
            if (node.parent) {
                const parent = this.selectedMindmap.nodes.find(n => n.id === node.parent);
                if (parent && parent.x !== undefined && node.x !== undefined) {
                    const line = document.createElement('div');
                    line.className = 'mindmap-connection';
                    
                    const x1 = parent.x + 80; // Offset for node width
                    const y1 = parent.y + 20; // Offset for node height center
                    const x2 = node.x;
                    const y2 = node.y + 20;
                    
                    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                    
                    line.style.width = `${length}px`;
                    line.style.height = '2px';
                    line.style.left = `${x1}px`;
                    line.style.top = `${y1}px`;
                    line.style.transform = `rotate(${angle}deg)`;
                    line.style.transformOrigin = '0 50%';
                    line.style.backgroundColor = '#6b7280';
                    line.style.zIndex = '1';
                    
                    container.appendChild(line);
                }
            }
        });
    }
    
    setupMindmapPanning() {
        const viewport = document.getElementById('mindmapViewport');
        let isDragging = false;
        let startX, startY, startTranslateX = 0, startTranslateY = 0;
        
        viewport.addEventListener('mousedown', (e) => {
            if (e.target === viewport || e.target.id === 'mindmapContent') {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                viewport.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                const newTranslateX = startTranslateX + deltaX;
                const newTranslateY = startTranslateY + deltaY;
                
                viewport.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${this.mindmapZoom})`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                viewport.style.cursor = 'grab';
                const transform = viewport.style.transform;
                const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                if (match) {
                    startTranslateX = parseFloat(match[1]);
                    startTranslateY = parseFloat(match[2]);
                }
            }
        });
    }

    editSelectedMindmap() {
        if (!this.selectedMindmap) return;
        
        // Pre-fill the modal with existing data
        document.getElementById('mindmapModalTitle').textContent = 'Edit Mindmap';
        document.getElementById('mindmapTitle').value = this.selectedMindmap.title;
        
        // Convert nodes back to bullet-point structure
        const structure = this.convertNodesToStructure(this.selectedMindmap.nodes);
        document.getElementById('mindmapStructure').value = structure;
        
        // Mark as editing
        this.editingMindmap = this.selectedMindmap;
        
        // Open modal
        this.openMindmapModal();
    }
    
    async deleteSelectedMindmap() {
        if (!this.selectedMindmap) return;
        
        if (confirm(`Delete mindmap "${this.selectedMindmap.title}"?`)) {
            try {
                await fetch(`/api/mindmaps/${this.selectedMindmap.id}`, { method: 'DELETE' });
                this.selectedMindmap = null;
                this.loadMindmaps(false); // Don't auto-select after deletion
                document.getElementById('mindmapSelector').value = '';
                document.getElementById('editMindmapBtn').style.display = 'none';
                document.getElementById('deleteMindmapBtn').style.display = 'none';
            } catch (error) {
                console.error('Error deleting mindmap:', error);
            }
        }
    }
    
    convertNodesToStructure(nodes) {
        // Convert nodes back to indented bullet points
        const rootNodes = nodes.filter(node => node.level === 0);
        let structure = '';
        
        rootNodes.forEach(rootNode => {
            structure += this.nodeToString(rootNode, nodes, 0);
        });
        
        return structure.trim();
    }
    
    nodeToString(node, allNodes, level) {
        const indent = '  '.repeat(level);
        let result = `${indent}- ${node.text}\n`;
        
        // Add children
        const children = allNodes.filter(n => n.parent === node.id);
        children.forEach(child => {
            result += this.nodeToString(child, allNodes, level + 1);
        });
        
        return result;
    }

    updateMindmapZoom(value) {
        this.mindmapZoom = parseFloat(value);
        const viewport = document.getElementById('mindmapViewport');
        viewport.style.transform = `translate(${this.mindmapOffset.x}px, ${this.mindmapOffset.y}px) scale(${this.mindmapZoom})`;
        document.getElementById('mindmapZoomLevel').textContent = `${Math.round(this.mindmapZoom * 100)}%`;
    }

    updateMindmapLayout(layout) {
        this.currentLayout = layout;
        console.log('Layout changed to:', layout); // Debug
        if (this.selectedMindmap) {
            this.renderMindmap();
        }
    }

    openMindmapModal() {
        document.getElementById('mindmapModal').classList.remove('hidden');
        document.getElementById('mindmapModal').classList.add('flex');
        
        if (!this.editingMindmap) {
            document.getElementById('mindmapModalTitle').textContent = 'Add Mindmap';
            document.getElementById('mindmapTitle').value = '';
            document.getElementById('mindmapStructure').value = '';
        }
    }

    closeMindmapModal() {
        document.getElementById('mindmapModal').classList.add('hidden');
        document.getElementById('mindmapModal').classList.remove('flex');
        this.editingMindmap = null;
        document.getElementById('mindmapModalTitle').textContent = 'Add Mindmap';
    }

    async handleMindmapSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('mindmapTitle').value;
        const structure = document.getElementById('mindmapStructure').value;
        
        // Parse the structure into nodes
        const nodes = this.parseMindmapStructure(structure);
        
        try {
            let response;
            if (this.editingMindmap) {
                // Update existing mindmap
                response = await fetch(`/api/mindmaps/${this.editingMindmap.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, nodes })
                });
            } else {
                // Create new mindmap
                response = await fetch('/api/mindmaps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, nodes })
                });
            }
            
            if (response.ok) {
                this.closeMindmapModal();
                this.loadMindmaps();
                
                // If we were editing, reselect the mindmap
                if (this.editingMindmap) {
                    setTimeout(() => {
                        document.getElementById('mindmapSelector').value = this.editingMindmap.id;
                        this.selectMindmap(this.editingMindmap.id);
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Error saving mindmap:', error);
        }
    }

    parseMindmapStructure(structure) {
        const lines = structure.split('\n').filter(line => line.trim());
        const nodes = [];
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ')) {
                const level = (line.length - line.trimStart().length) / 2;
                const text = trimmed.substring(2);
                
                const node = {
                    id: `node_${index + 1}`,
                    text,
                    level,
                    children: []
                };
                
                // Find parent based on level
                if (level > 0) {
                    for (let i = nodes.length - 1; i >= 0; i--) {
                        if (nodes[i].level === level - 1) {
                            node.parent = nodes[i].id;
                            nodes[i].children.push(node);
                            break;
                        }
                    }
                }
                
                nodes.push(node);
            }
        });
        
        return nodes;
    }

    exportMindmapCSV() {
        window.open('/api/export/csv/mindmaps', '_blank');
    }
}

// Initialize the app
const taskManager = new TaskManager();