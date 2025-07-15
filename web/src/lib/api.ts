import type { Task, TaskStatus } from '@/types/task';
import type { Project, Agent } from '@/types/project';

const API_BASE_URL = 'http://localhost:8080/api';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  assignee?: string;
  agentId?: string;
  tags?: string[];
  projectId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignee?: string;
  agentId?: string;
  tags?: string[];
  projectId?: string;
}

export interface ApiTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  agent_id?: string;
  agent?: Agent;
  tags: string[];
  created_at: string;
  updated_at: string;
  project_id?: string;
}

export interface TaskListResponse {
  tasks: ApiTask[];
  total: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  directory: string;
  agentId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  directory?: string;
  agentId?: string;
}

export interface ApiProject {
  id: string;
  name: string;
  description: string;
  directory: string;
  agent_id?: string;
  agent?: Agent;
  created_at: string;
  updated_at: string;
}

export interface ProjectListResponse {
  projects: ApiProject[];
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
    agentId: apiTask.agent_id,
    agent: apiTask.agent ? {
      id: apiTask.agent.id,
      name: apiTask.agent.name,
      type: apiTask.agent.type,
      description: apiTask.agent.description,
      createdAt: new Date(apiTask.agent.createdAt),
      updatedAt: new Date(apiTask.agent.updatedAt),
    } : undefined,
    tags: apiTask.tags || [],
    createdAt: new Date(apiTask.created_at),
    updatedAt: new Date(apiTask.updated_at),
    projectId: apiTask.project_id,
  };
}

// Transform API project to frontend project
function transformApiProject(apiProject: ApiProject): Project {
  return {
    id: apiProject.id,
    name: apiProject.name,
    description: apiProject.description || undefined,
    directory: apiProject.directory,
    agentId: apiProject.agent_id,
    agent: apiProject.agent ? {
      id: apiProject.agent.id,
      name: apiProject.agent.name,
      type: apiProject.agent.type,
      description: apiProject.agent.description,
      createdAt: new Date(apiProject.agent.createdAt),
      updatedAt: new Date(apiProject.agent.updatedAt),
    } : undefined,
    createdAt: new Date(apiProject.created_at),
    updatedAt: new Date(apiProject.updated_at),
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
    // Transform frontend camelCase to backend snake_case
    const requestBody = {
      title: task.title,
      description: task.description,
      status: task.status,
      assignee: task.assignee,
      agent_id: task.agentId, // Convert camelCase to snake_case
      tags: task.tags,
      project_id: task.projectId, // Convert camelCase to snake_case
    };

    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    const data: ApiTask = await response.json();
    return transformApiTask(data);
  },

  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task> {
    // Transform frontend camelCase to backend snake_case
    const requestBody = {
      title: updates.title,
      description: updates.description,
      status: updates.status,
      assignee: updates.assignee,
      agent_id: updates.agentId, // Convert camelCase to snake_case
      tags: updates.tags,
      project_id: updates.projectId, // Convert camelCase to snake_case
    };

    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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

export const agentApi = {
  async getAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE_URL}/agents`);
    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }
    const data: { agents: Agent[]; total: number } = await response.json();
    return data.agents.map(agent => ({
      ...agent,
      createdAt: new Date(agent.createdAt),
      updatedAt: new Date(agent.updatedAt),
    }));
  },
};

export const projectApi = {
  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    const data: ProjectListResponse = await response.json();
    return data.projects.map(transformApiProject);
  },

  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }
    const data: ApiProject = await response.json();
    return transformApiProject(data);
  },

  async createProject(project: CreateProjectRequest): Promise<Project> {
    // Transform frontend camelCase to backend snake_case
    const requestBody = {
      name: project.name,
      description: project.description,
      directory: project.directory,
      agent_id: project.agentId, // Convert camelCase to snake_case
    };

    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error('Failed to create project');
    }
    const data: ApiProject = await response.json();
    return transformApiProject(data);
  },

  async updateProject(id: string, updates: UpdateProjectRequest): Promise<Project> {
    // Transform frontend camelCase to backend snake_case
    const requestBody = {
      name: updates.name,
      description: updates.description,
      directory: updates.directory,
      agent_id: updates.agentId, // Convert camelCase to snake_case
    };

    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error('Failed to update project');
    }
    const data: ApiProject = await response.json();
    return transformApiProject(data);
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  },
};