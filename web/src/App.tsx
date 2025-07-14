import { useState } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { haptics } from '@/lib/haptics';
import { Search, Plus } from 'lucide-react';
import type { Task } from '@/types/task';

function App() {
  const { tasks, handleDragEnd } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');

  const handleEditTask = (task: Task) => {
    console.log('Edit task:', task);
    // TODO: Implement task editing modal/form
  };


  const handleViewTaskDetails = (task: Task) => {
    console.log('View task details:', task);
    // TODO: Implement task details modal/panel
  };

  const handleAddTask = () => {
    haptics.medium();
    console.log('Add new task');
    // TODO: Implement add task modal/form
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kanban Board</h1>
              <p className="text-sm text-muted-foreground">
                Manage your tasks with drag and drop
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
          onViewTaskDetails={handleViewTaskDetails}
        />
      </main>
    </div>
  );
}

export default App;
