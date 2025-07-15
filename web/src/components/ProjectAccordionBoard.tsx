import { useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { KanbanBoard } from '@/components/KanbanBoard';
import { FolderOpen, Settings, Trash2, Plus, Clock } from 'lucide-react';
import type { Task } from '@/types/task';
import type { Project } from '@/types/project';

interface ProjectAccordionBoardProps {
  projects: Project[];
  tasks: Task[];
  searchQuery: string;
  onDragEnd: (event: DragEndEvent) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onViewTaskDetails: (task: Task) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onAddTask: (projectId?: string) => void;
}

export function ProjectAccordionBoard({
  projects,
  tasks,
  searchQuery,
  onDragEnd,
  onEditTask,
  onDeleteTask,
  onViewTaskDetails,
  onEditProject,
  onDeleteProject,
  onAddTask,
}: ProjectAccordionBoardProps) {
  // Filter and group tasks by project
  const filteredTasksByProject = useMemo(() => {
    const projectTaskMap = new Map<string, Task[]>();
    
    // Initialize all projects with empty arrays
    projects.forEach(project => {
      projectTaskMap.set(project.id, []);
    });
    
    // Filter tasks based on search query and group by project
    const filtered = tasks.filter(task => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignee?.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    });
    
    // Group filtered tasks by project
    filtered.forEach(task => {
      if (task.projectId) {
        const projectTasks = projectTaskMap.get(task.projectId) || [];
        projectTasks.push(task);
        projectTaskMap.set(task.projectId, projectTasks);
      }
    });
    
    return projectTaskMap;
  }, [tasks, projects, searchQuery]);

  // Calculate project statistics
  const getProjectStats = (projectId: string) => {
    const projectTasks = filteredTasksByProject.get(projectId) || [];
    const total = projectTasks.length;
    const completed = projectTasks.filter(task => task.status === 'done').length;
    const inProgress = projectTasks.filter(task => task.status === 'inprogress').length;
    return { total, completed, inProgress };
  };

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first project to organize your tasks.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="space-y-4" defaultValue={projects.map(p => p.id)}>
        {projects.map((project) => {
          const stats = getProjectStats(project.id);
          const projectTasks = filteredTasksByProject.get(project.id) || [];
          
          return (
            <AccordionItem
              key={project.id}
              value={project.id}
              className="border rounded-lg bg-card"
            >
              <div className="flex items-center justify-between px-6 py-4">
                <AccordionTrigger className="flex-1 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <h3 className="text-lg font-semibold">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {project.directory}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Project Stats */}
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {stats.total} tasks
                      </Badge>
                      {stats.inProgress > 0 && (
                        <Badge variant="default" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {stats.inProgress} active
                        </Badge>
                      )}
                      {stats.completed > 0 && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          {stats.completed} done
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                
                {/* Project Actions - Outside of AccordionTrigger */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProject(project);
                    }}
                    title="Edit project"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
                        onDeleteProject(project.id);
                      }
                    }}
                    title="Delete project"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              
              <AccordionContent className="px-6 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Tasks ({projectTasks.length})
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddTask(project.id)}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                </div>
                
                {projectTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                      <Plus className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-medium">No tasks yet</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start by adding some tasks to this project.
                    </p>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <KanbanBoard
                      tasks={projectTasks}
                      searchQuery="" // Search is handled at the project level
                      onDragEnd={onDragEnd}
                      onEditTask={onEditTask}
                      onDeleteTask={onDeleteTask}
                      onViewTaskDetails={onViewTaskDetails}
                      compact={true} // Make it more compact for accordion view
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}