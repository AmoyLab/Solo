import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus } from '@/types/task';
import {
  Calendar,
  User,
  Tag,
  Clock,
  Edit2,
  Trash2,
  CheckCircle,
  Circle,
  AlertCircle,
  XCircle,
  PauseCircle
} from 'lucide-react';

interface TaskDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const statusConfig: Record<TaskStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  todo: {
    label: 'To Do',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    icon: Circle,
  },
  inprogress: {
    label: 'In Progress',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: PauseCircle,
  },
  inreview: {
    label: 'In Review',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: AlertCircle,
  },
  done: {
    label: 'Done',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
  },
};

const priorityConfig: Record<TaskPriority, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  low: {
    label: 'Low',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  high: {
    label: 'High',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    dotColor: 'bg-orange-500',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
  },
};

export function TaskDetailsDrawer({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete
}: TaskDetailsDrawerProps) {
  if (!task) return null;

  const statusInfo = statusConfig[task.status];
  const priorityInfo = priorityConfig[task.priority];
  const StatusIcon = statusInfo.icon;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleEdit = () => {
    onEdit(task);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(task);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[300px] sm:w-[350px] md:w-[450px] lg:w-[600px] xl:w-[750px]">
        <SheetHeader>
          <SheetTitle className="text-left pr-8">
            {task.title}
          </SheetTitle>
          <SheetDescription className="text-left">
            Task details and information
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-700 hover:text-white hover:bg-red-700 border-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Status
            </label>
            <div>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border",
                statusInfo.color,
                statusInfo.bgColor,
                statusInfo.borderColor
              )}>
                <StatusIcon className="h-4 w-4" />
                {statusInfo.label}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Priority
            </label>
            <div>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border",
                priorityInfo.color,
                priorityInfo.bgColor,
                priorityInfo.borderColor
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  priorityInfo.dotColor
                )} />
                {priorityInfo.label}
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <div className="text-sm text-foreground leading-relaxed">
                {task.description}
              </div>
            </div>
          )}

          {/* Assignee */}
          {task.assignee && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Assignee
              </label>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{task.assignee}</span>
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Tags
              </label>
              <div className="space-y-2">
                {task.tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-muted/50 hover:bg-muted border border-border rounded-md transition-colors"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Due Date
              </label>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateShort(task.dueDate)}</span>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatDate(task.createdAt)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Last Updated
              </label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatDate(task.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}