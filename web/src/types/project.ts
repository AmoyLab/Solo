export interface Agent {
  id: string;
  name: string;
  type: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  directory: string;
  description?: string;
  agentId?: string;
  agent?: Agent;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProject {
  name: string;
  directory: string;
  description?: string;
  agentId?: string;
}

export interface UpdateProject {
  name?: string;
  directory?: string;
  description?: string;
  agentId?: string;
}