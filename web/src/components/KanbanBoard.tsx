import { useMemo } from 'react';
import {
  type DragEndEvent,
  KanbanContainer,
  KanbanCard,
  KanbanProvider,
} from '@/components/ui/kanban';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '@/types/task';
import type { UniqueIdentifier } from '@dnd-kit/core';

interface KanbanBoardProps {
  tasks: Task[];
  searchQuery?: string;
  onDragEnd: (event: DragEndEvent) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onViewTaskDetails: (task: Task) => void;
}

const allTaskStatuses: TaskStatus[] = [
  'todo',
  'inprogress',
  'inreview',
  'done',
  'cancelled',
];

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  inreview: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

const statusBoardColors: Record<TaskStatus, string> = {
  todo: 'hsl(var(--muted-foreground))',
  inprogress: 'hsl(var(--primary))',
  inreview: 'hsl(var(--chart-4))',
  done: 'hsl(var(--chart-2))',
  cancelled: 'hsl(var(--destructive))',
};

export function KanbanBoard({
  tasks,
  searchQuery = '',
  onDragEnd,
  onEditTask,
  onDeleteTask,
  onViewTaskDetails,
}: KanbanBoardProps) {
  // Memoize filtered tasks
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks;
    }
    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.assignee && task.assignee.toLowerCase().includes(query)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }, [tasks, searchQuery]);

  // Memoize grouped tasks - convert to UniqueIdentifier format
  const { groupedTasks, containers } = useMemo(() => {
    const groups: Record<TaskStatus, UniqueIdentifier[]> = {} as Record<TaskStatus, UniqueIdentifier[]>;
    allTaskStatuses.forEach((status) => {
      groups[status] = [];
    });
    
    filteredTasks.forEach((task) => {
      const normalizedStatus = task.status.toLowerCase() as TaskStatus;
      if (groups[normalizedStatus]) {
        groups[normalizedStatus].push(task.id);
      } else {
        groups['todo'].push(task.id);
      }
    });
    
    return {
      groupedTasks: groups,
      containers: allTaskStatuses,
    };
  }, [filteredTasks]);

  // Create task lookup for quick access
  const taskLookup = useMemo(() => {
    const lookup: Record<string, Task> = {};
    filteredTasks.forEach((task) => {
      lookup[task.id] = task;
    });
    return lookup;
  }, [filteredTasks]);

  return (
    <div className="h-full overflow-auto">
      <KanbanProvider onDragEnd={onDragEnd} items={groupedTasks} handle={true}>
        <SortableContext items={containers} strategy={verticalListSortingStrategy}>
          {containers.map((containerId) => (
            <KanbanContainer
              key={containerId}
              id={containerId}
              title={statusLabels[containerId]}
              color={statusBoardColors[containerId]}
              items={groupedTasks[containerId]}
            >
              <SortableContext items={groupedTasks[containerId]} strategy={verticalListSortingStrategy}>
                {groupedTasks[containerId].map((taskId) => {
                  const task = taskLookup[taskId as string];
                  if (!task) return null;
                  
                  return (
                    <KanbanCard
                      key={taskId}
                      id={taskId}
                      handle={true}
                    >
                      <TaskCard
                        task={task}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onViewDetails={onViewTaskDetails}
                      />
                    </KanbanCard>
                  );
                })}
              </SortableContext>
            </KanbanContainer>
          ))}
        </SortableContext>
      </KanbanProvider>
    </div>
  );
}