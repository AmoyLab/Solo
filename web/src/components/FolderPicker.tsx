import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Folder,
  FolderOpen,
  File,
  AlertCircle,
  Home,
  ChevronUp,
  Search,
  Loader2,
} from 'lucide-react';

interface FolderPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  value?: string;
  title?: string;
  description?: string;
}

interface DirectoryEntry {
  name: string;
  path: string;
  is_directory: boolean;
  is_git_repo: boolean;
}

interface ApiResponse {
  success: boolean;
  data: DirectoryEntry[] | null;
  message: string | null;
}

export function FolderPicker({
  open,
  onClose,
  onSelect,
  value = '',
  title = 'Select Folder',
  description = 'Choose a folder for your project',
}: FolderPickerProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualPath, setManualPath] = useState(value);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return entries;
    return entries.filter((entry) =>
      entry.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entries, searchTerm]);

  useEffect(() => {
    if (open) {
      setManualPath(value);
      setSearchTerm('');
      loadDirectory();
    }
  }, [open, value]);

  const loadDirectory = async (path?: string) => {
    setLoading(true);
    setError('');

    try {
      const queryParam = path ? `?path=${encodeURIComponent(path)}` : '';
      const response = await fetch(`http://localhost:8080/api/filesystem/list${queryParam}`);

      if (!response.ok) {
        throw new Error('Failed to load directory');
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setEntries(data.data || []);
        const newPath = data.message || '';
        setCurrentPath(newPath);
        // Update manual path when navigating
        if (newPath) {
          setManualPath(newPath);
        }
      } else {
        setError(data.message || 'Failed to load directory');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (entry: DirectoryEntry) => {
    if (entry.is_directory) {
      loadDirectory(entry.path);
    }
  };

  const handleParentDirectory = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    const newPath = parentPath || '/';
    loadDirectory(newPath);
  };

  const handleHomeDirectory = () => {
    loadDirectory();
  };

  const handleManualPathSubmit = () => {
    if (manualPath.trim()) {
      loadDirectory(manualPath.trim());
    }
  };

  const handleSelectCurrent = () => {
    onSelect(currentPath);
    onClose();
  };

  const handleSelectManual = () => {
    onSelect(manualPath.trim());
    onClose();
  };

  const handleClose = () => {
    setError('');
    setSearchTerm('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualPathSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[600px] w-full h-[700px] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Usage Instructions */}
          <div className="text-xs text-muted-foreground border-b pb-2">
            Click folder names to navigate • Use action buttons to select
          </div>

          {/* Manual path input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Enter path manually:</Label>
            <div className="flex space-x-2">
              <Input
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="/path/to/your/project"
                className="flex-1"
              />
              <Button
                onClick={handleManualPathSubmit}
                variant="outline"
                size="sm"
                disabled={!manualPath.trim()}
              >
                Go
              </Button>
            </div>
          </div>

          {/* Search input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Search current directory:</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter folders and files..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleHomeDirectory}
              variant="outline"
              size="sm"
              title="Go to home directory"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleParentDirectory}
              variant="outline"
              size="sm"
              disabled={!currentPath || currentPath === '/'}
              title="Go to parent directory"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <div className="text-sm text-muted-foreground flex-1 truncate">
              {currentPath || 'Home'}
            </div>
            <Button
              onClick={handleSelectCurrent}
              variant="outline"
              size="sm"
              disabled={!currentPath}
              title="Select current directory"
            >
              Select Current
            </Button>
          </div>

          {/* Directory listing */}
          <div className="flex-1 border rounded-md overflow-auto">
            {loading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {searchTerm.trim() ? 'No matches found' : 'No folders found'}
              </div>
            ) : (
              <div className="p-2">
                {filteredEntries.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent transition-colors ${
                      !entry.is_directory ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => entry.is_directory && handleFolderClick(entry)}
                    title={entry.name}
                  >
                    {entry.is_directory ? (
                      entry.is_git_repo ? (
                        <FolderOpen className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )
                    ) : (
                      <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-sm flex-1 truncate">
                      {entry.name}
                    </span>
                    {entry.is_git_repo && (
                      <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded flex-shrink-0">
                        git repo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSelectManual} disabled={!manualPath.trim()}>
            Select Path
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}