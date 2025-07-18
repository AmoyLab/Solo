export type TaskStatus = 'todo' | 'inprogress' | 'inreview' | 'done' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  agentId?: string;
  agent?: import('@/types/project').Agent;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  tags?: string[];
  projectId?: string;
}