import { useState, useCallback, useEffect } from 'react';
import type { Project, CreateProject, UpdateProject } from '@/types/project';
import { projectApi } from '@/lib/api';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects from API
  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedProjects = await projectApi.getProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(async (projectData: CreateProject) => {
    try {
      const createdProject = await projectApi.createProject({
        name: projectData.name,
        directory: projectData.directory,
        description: projectData.description,
      });
      setProjects((prevProjects) => [...prevProjects, createdProject]);
      return createdProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: UpdateProject) => {
    try {
      const updatedProject = await projectApi.updateProject(id, {
        name: updates.name,
        directory: updates.directory,
        description: updates.description,
      });
      
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === id ? updatedProject : project
        )
      );
      
      return updatedProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    // Optimistically remove from UI
    const projectToDelete = projects.find(p => p.id === id);
    setProjects((prevProjects) => prevProjects.filter((project) => project.id !== id));

    try {
      await projectApi.deleteProject(id);
    } catch (err) {
      // Revert on error
      if (projectToDelete) {
        setProjects((prevProjects) => [...prevProjects, projectToDelete]);
      }
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  }, [projects]);

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