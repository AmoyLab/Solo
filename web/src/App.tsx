import { useState, useEffect } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskModal } from '@/components/TaskModal';
import { TaskDetailsDrawer } from '@/components/TaskDetailsDrawer';
import { DeleteTaskDialog } from '@/components/DeleteTaskDialog';
import { ProjectSelector } from '@/components/ProjectSelector';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { haptics } from '@/lib/haptics';
import { Search, Plus, ArrowLeft } from 'lucide-react';
import type { Task } from '@/types/task';
import type { Project } from '@/types/project';

const SELECTED_PROJECT_KEY = 'kanban-selected-project';

function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { tasks, loading, error, handleDragEnd, addTask, updateTask, deleteTask } = useTasks(selectedProject?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Load selected project from localStorage on mount
  useEffect(() => {
    const storedProjectId = localStorage.getItem(SELECTED_PROJECT_KEY);
    if (storedProjectId) {
      // In a real app, you would fetch the project details from an API
      // For now, we'll just clear the stored project and let the user select again
      localStorage.removeItem(SELECTED_PROJECT_KEY);
    }
  }, []);

  // Save selected project to localStorage when it changes
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem(SELECTED_PROJECT_KEY, selectedProject.id);
    } else {
      localStorage.removeItem(SELECTED_PROJECT_KEY);
    }
  }, [selectedProject]);

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

  const handleAddTask = () => {
    haptics.medium();
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (taskData: {
    title: string;
    description?: string;
    status: 'todo' | 'inprogress' | 'inreview' | 'done' | 'cancelled';
    assignee?: string;
    tags?: string[];
  }) => {
    if (editingTask) {
      // Update existing task
      await updateTask(editingTask.id, {
        ...taskData,
        priority: editingTask.priority, // Keep existing priority
      });
    } else {
      // Add new task
      await addTask({
        ...taskData,
        priority: 'medium', // Default priority
      });
    }
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

  // Show project selector if no project is selected
  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background">
        <ProjectSelector 
          selectedProjectId={null}
          onProjectSelect={setSelectedProject}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProject(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{selectedProject.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedProject.directory}
                </p>
              </div>
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
              {/* Add Task Button */}
              <Button onClick={handleAddTask} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 h-[calc(100vh-120px)]">
        <KanbanBoard
          tasks={tasks}
          searchQuery={searchQuery}
          onDragEnd={handleDragEnd}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onViewTaskDetails={handleViewTaskDetails}
        />
      </main>

      {/* Task Modal (Add/Edit) */}
      <TaskModal
        open={showTaskModal}
        onOpenChange={handleModalClose}
        task={editingTask || undefined}
        onSubmit={handleTaskSubmit}
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
    </div>
  );
}

export default App;
