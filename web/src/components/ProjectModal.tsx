import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FolderPicker } from '@/components/FolderPicker';
import { FolderOpen, AlertCircle } from 'lucide-react';
import type { Project } from '@/types/project';

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSubmit: (projectData: {
    name: string;
    directory: string;
    description?: string;
  }) => Promise<void>;
}

export function ProjectModal({ open, onOpenChange, project, onSubmit }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [directory, setDirectory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDirectory(project.directory);
      setDescription(project.description || '');
    } else {
      setName('');
      setDirectory('');
      setDescription('');
    }
    setError(null);
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        directory: directory.trim(),
        description: description.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectoryChange = (path: string) => {
    setDirectory(path);
    // Auto-generate project name from directory if not editing and name is empty
    if (!isEditing && !name.trim()) {
      const dirName = path.split('/').filter(Boolean).pop() || '';
      if (dirName) {
        setName(dirName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
    }
  };

  const handleDirectorySelect = () => {
    setShowFolderPicker(true);
  };

  const handleFolderPickerSelect = (path: string) => {
    handleDirectoryChange(path);
    setShowFolderPicker(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your project details.' 
              : 'Create a new project by selecting a directory and giving it a name.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="directory">Directory</Label>
            <div className="flex space-x-2">
              <Input
                id="directory"
                value={directory}
                onChange={(e) => handleDirectoryChange(e.target.value)}
                placeholder="/path/to/project"
                autoComplete="off"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDirectorySelect}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Select the directory where your project files are located
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              autoComplete="off"
              rows={3}
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || !directory.trim()}
            >
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <FolderPicker
        open={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        onSelect={handleFolderPickerSelect}
        value={directory}
        title="Select Project Directory"
        description="Choose the directory where your project is located"
      />
    </Dialog>
  );
}