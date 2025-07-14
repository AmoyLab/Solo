export interface Project {
  id: string;
  name: string;
  directory: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProject {
  name: string;
  directory: string;
  description?: string;
}

export interface UpdateProject {
  name?: string;
  directory?: string;
  description?: string;
}