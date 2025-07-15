import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Project } from "@/types/project"
import { Trash2 } from "lucide-react"

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  taskCount?: number
  onConfirm: () => void
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  taskCount = 0,
  onConfirm,
}: DeleteProjectDialogProps) {
  if (!project) return null

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-700" />
            Delete Project
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{project.name}"</strong>?
            {taskCount > 0 ? (
              <>
                This action cannot be undone and will permanently remove the project and <strong>{taskCount} task{taskCount !== 1 ? 's' : ''}</strong>.
              </>
            ) : (
              <>
                This action cannot be undone and will permanently remove the project.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            variant="outline"
            className="text-red-700 border-red-700 hover:bg-red-700 hover:text-white"
          >
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}