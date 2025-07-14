import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import type { Task, TaskPriority } from '@/types/task';
import { MoreHorizontal, Calendar, User, Tag, Move, Edit2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onViewDetails?: (task: Task) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement> & {
    onPointerDown?: (event: React.PointerEvent) => void;
  };
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const priorityTextColors: Record<TaskPriority, string> = {
  low: 'text-blue-700',
  medium: 'text-yellow-700',
  high: 'text-orange-700',
  urgent: 'text-red-700',
};

// Content component that doesn't receive drag props
function TaskCardContent({
  task,
  onEdit,
  onDelete,
  onViewDetails,
  dragHandleProps,
}: {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onViewDetails?: (task: Task) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement> & {
    onPointerDown?: (event: React.PointerEvent) => void;
  };
}) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on drag handle or dragging
    if ((e.target as Element).closest('.drag-handle') || e.currentTarget.classList.contains('dragging')) {
      return;
    }
    onViewDetails?.(task);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.light();
    onEdit?.(task);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.light();
    onDelete?.(task);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-3" onClick={handleCardClick}>
      {/* Header with title and menu */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="flex-shrink-0 p-1 rounded hover:bg-muted/50 transition-all duration-200 group cursor-grab active:cursor-grabbing drag-handle"
            title="Drag to move task"
            tabIndex={0}
            role="button"
            aria-label="Drag to move task"
          >
            <Move className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <h4 className="font-medium text-sm line-clamp-2 flex-1 min-w-0">
            {task.title}
          </h4>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-2 flex-shrink-0 hover:bg-muted/80"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleEditClick} className="cursor-pointer">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDeleteClick}
              className="text-red-700 focus:text-red-700 hover:bg-red-700 hover:text-white cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Priority badge */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            priorityColors[task.priority]
          )}
        />
        <span
          className={cn(
            'text-xs font-medium capitalize',
            priorityTextColors[task.priority]
          )}
        >
          {task.priority}
        </span>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-md"
            >
              <Tag className="h-2 w-2" />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{task.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer with assignee and due date */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {task.assignee && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{task.assignee}</span>
          </div>
        )}
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onViewDetails,
  dragHandleProps,
}: TaskCardProps) {
  return (
    <TaskCardContent
      task={task}
      onEdit={onEdit}
      onDelete={onDelete}
      onViewDetails={onViewDetails}
      dragHandleProps={dragHandleProps}
    />
  );
}