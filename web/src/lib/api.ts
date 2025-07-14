import type { Task, TaskStatus } from '@/types/task';

const API_BASE_URL = 'http://localhost:8080/api';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  assignee?: string;
  tags?: string[];
  projectId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignee?: string;
  tags?: string[];
}

export interface ApiTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  project_id?: string;
}

export interface TaskListResponse {
  tasks: ApiTask[];
  total: number;
}

// Transform API task to frontend task
function transformApiTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description || undefined,
    status: apiTask.status,
    priority: 'medium', // Default priority since API doesn't have this field
    assignee: apiTask.assignee || undefined,
    tags: apiTask.tags || [],
    createdAt: new Date(apiTask.created_at),
    updatedAt: new Date(apiTask.updated_at),
    projectId: apiTask.project_id,
  };
}

// Transform frontend task to API request (currently unused but might be needed later)
// function transformToApiRequest(task: Partial<Task>): CreateTaskRequest | UpdateTaskRequest {
//   return {
//     title: task.title,
//     description: task.description,
//     status: task.status,
//     assignee: task.assignee,
//     tags: task.tags,
//     projectId: task.projectId,
//   };
// }

export const taskApi = {
  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    const data: TaskListResponse = await response.json();
    return data.tasks.map(transformApiTask);
  },

  async getTask(id: string): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch task');
    }
    const data: ApiTask = await response.json();
    return transformApiTask(data);
  },

  async createTask(task: CreateTaskRequest): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    const data: ApiTask = await response.json();
    return transformApiTask(data);
  },

  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    const data: ApiTask = await response.json();
    return transformApiTask(data);
  },

  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  },
};