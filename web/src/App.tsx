import { useState } from 'react';
import { TaskModal } from '@/components/TaskModal';
import { TaskDetailsDrawer } from '@/components/TaskDetailsDrawer';
import { DeleteTaskDialog } from '@/components/DeleteTaskDialog';
import { DeleteProjectDialog } from '@/components/DeleteProjectDialog';
import { ProjectModal } from '@/components/ProjectModal';
import { ProjectAccordionBoard } from '@/components/ProjectAccordionBoard';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { haptics } from '@/lib/haptics';
import { Search, Plus, FolderPlus } from 'lucide-react';
import type { Task } from '@/types/task';
import type { Project } from '@/types/project';

function App() {
  const { projects, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects();
  const { tasks, loading: tasksLoading, handleDragEnd, addTask, updateTask, deleteTask } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [defaultProjectId, setDefaultProjectId] = useState<string>('');

  const handleEditTask = (task: Task) => {
    haptics.light();
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = (task: Task) => {
    haptics.light();
    setTaskToDelete(task);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      haptics.medium();
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  const handleViewTaskDetails = (task: Task) => {
    haptics.light();
    setSelectedTask(task);
    setShowDetailsDrawer(true);
  };

  const handleAddTask = (projectId?: string) => {
    haptics.medium();
    setEditingTask(null);
    setShowTaskModal(true);
    // 如果提供了项目ID，我们需要一种方式传递给TaskModal
    // 我们将添加一个新的状态来跟踪默认项目
    if (projectId) {
      setDefaultProjectId(projectId);
    } else {
      setDefaultProjectId('');
    }
  };

  const handleTaskSubmit = async (taskData: {
    title: string;
    description?: string;
    status: 'todo' | 'inprogress' | 'inreview' | 'done' | 'cancelled';
    assignee?: string;
    tags?: string[];
    projectId?: string;
  }) => {
    if (editingTask) {
      // Update existing task
      await updateTask(editingTask.id, {
        ...taskData,
        priority: editingTask.priority, // Keep existing priority
      });
    } else {
      // Add new task - projectId should be provided in taskData
      await addTask({
        ...taskData,
        priority: 'medium', // Default priority
      });
    }
  };

  const handleProjectSubmit = async (projectData: {
    name: string;
    directory: string;
    description?: string;
  }) => {
    if (editingProject) {
      await updateProject(editingProject.id, projectData);
    } else {
      await createProject(projectData);
    }
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleModalClose = (open: boolean) => {
    setShowTaskModal(open);
    if (!open) {
      setEditingTask(null);
    }
  };

  const handleDrawerClose = (open: boolean) => {
    setShowDetailsDrawer(open);
    if (!open) {
      setSelectedTask(null);
    }
  };

  const handleEditFromDrawer = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteFromDrawer = (task: Task) => {
    handleDeleteTask(task);
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowProjectModal(true);
  };

  const handleDeleteProject = (project: Project) => {
    haptics.light();
    setProjectToDelete(project);
    setShowDeleteProjectDialog(true);
  };

  const handleConfirmDeleteProject = async () => {
    if (projectToDelete) {
      haptics.medium();
      
      // First delete all tasks belonging to this project
      const projectTasks = tasks.filter(task => task.projectId === projectToDelete.id);
      for (const task of projectTasks) {
        await deleteTask(task.id);
      }
      
      // Then delete the project
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  if (projectsLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Show error if there's an issue loading projects or tasks
  const hasError = false; // We'll handle errors in individual components
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading data</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Task Board</h1>
              <p className="text-sm text-muted-foreground">
                Manage tasks across all your projects
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Project Management Button */}
              <Button onClick={handleCreateProject} variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Project
              </Button>
              {/* Add Task Button */}
              <Button onClick={() => handleAddTask()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 h-[calc(100vh-120px)]">
        <ProjectAccordionBoard
          projects={projects}
          tasks={tasks}
          searchQuery={searchQuery}
          onDragEnd={handleDragEnd}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onViewTaskDetails={handleViewTaskDetails}
          onEditProject={(project) => {
            setEditingProject(project);
            setShowProjectModal(true);
          }}
          onDeleteProject={handleDeleteProject}
          onAddTask={handleAddTask}
        />
      </main>

      {/* Task Modal (Add/Edit) */}
      <TaskModal
        open={showTaskModal}
        onOpenChange={handleModalClose}
        task={editingTask || undefined}
        onSubmit={handleTaskSubmit}
        defaultProjectId={defaultProjectId}
      />

      {/* Task Details Drawer */}
      <TaskDetailsDrawer
        open={showDetailsDrawer}
        onOpenChange={handleDrawerClose}
        task={selectedTask || undefined}
        onEdit={handleEditFromDrawer}
        onDelete={handleDeleteFromDrawer}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTaskDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        task={taskToDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* Project Modal (Add/Edit) */}
      <ProjectModal
        open={showProjectModal}
        onOpenChange={(open) => {
          setShowProjectModal(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
        onSubmit={handleProjectSubmit}
      />

      {/* Delete Project Dialog */}
      <DeleteProjectDialog
        open={showDeleteProjectDialog}
        onOpenChange={setShowDeleteProjectDialog}
        project={projectToDelete}
        taskCount={projectToDelete ? tasks.filter(task => task.projectId === projectToDelete.id).length : 0}
        onConfirm={handleConfirmDeleteProject}
      />
    </div>
  );
}

export default App;
