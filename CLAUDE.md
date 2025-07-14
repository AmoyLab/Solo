# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a React + TypeScript + Vite project with a Kanban board application. The main application code is located in the `web/` directory, with additional project templates in the `temp/` directory.

### Key Directories
- `web/` - Main React application
- `web/src/components/` - React components including UI components and KanbanBoard
- `web/src/hooks/` - Custom React hooks (useTasks for state management)
- `web/src/types/` - TypeScript type definitions
- `web/src/lib/` - Utility functions including haptics and utils

## Development Commands

All commands should be run from the `web/` directory:

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Lint code
pnpm lint

# Preview production build
pnpm preview
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **UI Components**: Radix UI primitives, shadcn/ui components
- **Package Manager**: pnpm
- **Build Tool**: Vite with TypeScript compilation

## Architecture Overview

### Core Components
- `App.tsx` - Main application component with header and search functionality
- `KanbanBoard.tsx` - Main kanban board component that manages task columns and filtering
- `TaskCard.tsx` - Individual task card component
- `components/ui/kanban.tsx` - Reusable kanban UI components (KanbanProvider, KanbanContainer, KanbanCard)

### State Management
- `useTasks.ts` - Custom hook managing task state with mock data
- Tasks are stored in local state with CRUD operations (add, update, delete)
- Drag and drop functionality integrated with task status updates

### Key Features
- Drag and drop task management across columns (todo, inprogress, inreview, done, cancelled)
- Task search functionality across title, description, assignee, and tags
- Haptic feedback for mobile interactions
- Responsive design with Tailwind CSS
- TypeScript for type safety

### Task Status Flow
Tasks can be in one of five states:
- `todo` - To Do
- `inprogress` - In Progress
- `inreview` - In Review
- `done` - Done
- `cancelled` - Cancelled

### Styling System
- Uses Tailwind CSS with custom CSS variables for theming
- Dark mode support via `darkMode: ["class"]`
- Custom color palette defined in `tailwind.config.js`
- Haptic feedback utilities in `lib/haptics.ts`

## Development Notes

- Uses path aliases: `@/` maps to `src/`
- ESLint configured with React and TypeScript rules
- TypeScript strict mode enabled
- Vite dev server with HMR
- PostCSS for CSS processing