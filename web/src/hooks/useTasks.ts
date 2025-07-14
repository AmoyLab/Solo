import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types/task';
import type { DragEndEvent } from '@dnd-kit/core';

// Mock data for demonstration
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design system setup',
    description: 'Create a comprehensive design system for the application',
    status: 'todo',
    priority: 'high',
    assignee: 'Alice',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    dueDate: new Date('2025-01-15'),
    tags: ['design', 'ui/ux'],
  },
  {
    id: '2',
    title: 'API integration',
    description: 'Integrate with the backend API endpoints',
    status: 'inprogress',
    priority: 'medium',
    assignee: 'Bob',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-05'),
    dueDate: new Date('2025-01-20'),
    tags: ['backend', 'api'],
  },
  {
    id: '3',
    title: 'Unit tests',
    description: 'Write comprehensive unit tests for components',
    status: 'inreview',
    priority: 'medium',
    assignee: 'Charlie',
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-07'),
    tags: ['testing'],
  },
  {
    id: '4',
    title: 'Documentation',
    description: 'Update project documentation',
    status: 'done',
    priority: 'low',
    assignee: 'Diana',
    createdAt: new Date('2025-01-04'),
    updatedAt: new Date('2025-01-08'),
    tags: ['docs'],
  },
  {
    id: '5',
    title: 'Performance optimization',
    description: 'Optimize application performance',
    status: 'todo',
    priority: 'urgent',
    assignee: 'Eve',
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-05'),
    dueDate: new Date('2025-01-12'),
    tags: ['performance', 'optimization'],
  },
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the containers (status) for both active and over items
    const findContainer = (id: string) => {
      // If the id is a container id (status), return it
      if (['todo', 'inprogress', 'inreview', 'done', 'cancelled'].includes(id)) {
        return id as TaskStatus;
      }
      // Otherwise, find which container this task belongs to
      const task = tasks.find(t => t.id === id);
      return task?.status || 'todo';
    };

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    // If we're dropping on a container (status column), move the task there
    if (['todo', 'inprogress', 'inreview', 'done', 'cancelled'].includes(overId)) {
      const newStatus = overId as TaskStatus;
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === activeId
            ? { ...task, status: newStatus, updatedAt: new Date() }
            : task
        )
      );
      return;
    }

    // If we're dropping on a task, we need to handle reordering
    if (activeContainer === overContainer) {
      // Same container - just reorder
      const containerTasks = tasks.filter(task => task.status === activeContainer);
      const activeIndex = containerTasks.findIndex(task => task.id === activeId);
      const overIndex = containerTasks.findIndex(task => task.id === overId);
      
      if (activeIndex !== overIndex) {
        const reorderedTasks = arrayMove(containerTasks, activeIndex, overIndex);
        
        setTasks((prevTasks) => {
          const otherTasks = prevTasks.filter(task => task.status !== activeContainer);
          return [...otherTasks, ...reorderedTasks];
        });
      }
    } else {
      // Different containers - move task to new container
      const newStatus = overContainer;
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === activeId
            ? { ...task, status: newStatus, updatedAt: new Date() }
            : task
        )
      );
    }
  }, [tasks]);

  const addTask = useCallback((newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks((prevTasks) => [...prevTasks, task]);
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      )
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  }, []);

  return {
    tasks,
    handleDragEnd,
    addTask,
    updateTask,
    deleteTask,
  };
}