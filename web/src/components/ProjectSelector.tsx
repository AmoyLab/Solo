import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectModal } from '@/components/ProjectModal';
import { useProjects } from '@/hooks/useProjects';
import { Plus, Folder, Settings, Trash2 } from 'lucide-react';
import type { Project } from '@/types/project';

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onProjectSelect: (project: Project) => void;
}

export function ProjectSelector({ selectedProjectId, onProjectSelect }: ProjectSelectorProps) {
  const { projects, loading, error, createProject, updateProject, deleteProject } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleCreateProject = async (projectData: {
    name: string;
    directory: string;
    description?: string;
  }) => {
    const newProject = await createProject(projectData);
    onProjectSelect(newProject);
  };

  const handleUpdateProject = async (projectData: {
    name: string;
    directory: string;
    description?: string;
  }) => {
    if (editingProject) {
      const updatedProject = await updateProject(editingProject.id, projectData);
      if (updatedProject) {
        onProjectSelect(updatedProject);
      }
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDelete = async (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await deleteProject(project.id);
      // If we're deleting the selected project, clear the selection
      if (selectedProjectId === project.id) {
        // You might want to select another project or show the selector again
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProject(null);
  };

  const handleModalSubmit = editingProject ? handleUpdateProject : handleCreateProject;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Select a Project</h2>
          <p className="text-muted-foreground">
            Choose a project to manage tasks for, or create a new one
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Folder className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first project.
            </p>
            <Button className="mt-4" onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedProjectId === project.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onProjectSelect(project)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {project.directory}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(project);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {selectedProjectId === project.id ? 'Selected' : 'Available'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {project.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectModal
        open={showModal}
        onOpenChange={handleModalClose}
        project={editingProject}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}