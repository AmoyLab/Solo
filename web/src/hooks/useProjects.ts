import { useState, useCallback, useEffect } from 'react';
import type { Project, CreateProject, UpdateProject } from '@/types/project';

// Mock data for now - in the future this would connect to an API
const STORAGE_KEY = 'kanban-projects';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects from localStorage
  const loadProjects = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedProjects = JSON.parse(stored);
        // Convert date strings back to Date objects
        const projectsWithDates = parsedProjects.map((project: Project) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
        }));
        setProjects(projectsWithDates);
      }
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save projects to localStorage
  const saveProjects = useCallback((projectList: Project[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectList));
    } catch {
      setError('Failed to save projects');
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(async (projectData: CreateProject) => {
    setLoading(true);
    setError(null);
    try {
      const newProject: Project = {
        id: Date.now().toString(),
        name: projectData.name,
        directory: projectData.directory,
        description: projectData.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      
      return newProject;
    } catch (err) {
      setError('Failed to create project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projects, saveProjects]);

  const updateProject = useCallback(async (id: string, updates: UpdateProject) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProjects = projects.map(project =>
        project.id === id
          ? { ...project, ...updates, updatedAt: new Date() }
          : project
      );
      
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      
      return updatedProjects.find(p => p.id === id);
    } catch (err) {
      setError('Failed to update project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projects, saveProjects]);

  const deleteProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProjects = projects.filter(project => project.id !== id);
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
    } catch (err) {
      setError('Failed to delete project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projects, saveProjects]);

  const getProject = useCallback((id: string) => {
    return projects.find(project => project.id === id);
  }, [projects]);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    loadProjects,
  };
}