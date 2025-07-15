import { useState, useCallback, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types/task';
import type { DragEndEvent } from '@dnd-kit/core';
import { taskApi } from '@/lib/api';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTasks = await taskApi.getTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
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
      
      // Optimistically update UI
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === activeId
            ? { ...task, status: newStatus, updatedAt: new Date() }
            : task
        )
      );

      // Update via API
      try {
        await taskApi.updateTask(activeId, { status: newStatus });
      } catch (err) {
        // Revert on error
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === activeId
              ? { ...task, status: activeContainer, updatedAt: new Date() }
              : task
          )
        );
        setError(err instanceof Error ? err.message : 'Failed to update task');
      }
      return;
    }

    // If we're dropping on a task, we need to handle reordering
    if (activeContainer === overContainer) {
      // Same container - just reorder (local only for now)
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
      
      // Optimistically update UI
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === activeId
            ? { ...task, status: newStatus, updatedAt: new Date() }
            : task
        )
      );

      // Update via API
      try {
        await taskApi.updateTask(activeId, { status: newStatus });
      } catch (err) {
        // Revert on error
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === activeId
              ? { ...task, status: activeContainer, updatedAt: new Date() }
              : task
          )
        );
        setError(err instanceof Error ? err.message : 'Failed to update task');
      }
    }
  }, [tasks]);

  const addTask = useCallback(async (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const createdTask = await taskApi.createTask({
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        assignee: newTask.assignee,
        tags: newTask.tags,
        projectId: newTask.projectId,
      });
      setTasks((prevTasks) => [...prevTasks, createdTask]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Optimistically update UI
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      )
    );

    try {
      const updatedTask = await taskApi.updateTask(taskId, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        assignee: updates.assignee,
        tags: updates.tags,
      });
      
      // Update with server response
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (err) {
      // Revert changes on error
      await loadTasks();
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }, [loadTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    // Optimistically remove from UI
    const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

    try {
      await taskApi.deleteTask(taskId);
    } catch (err) {
      // Revert on error
      if (taskToDelete) {
        setTasks((prevTasks) => [...prevTasks, taskToDelete]);
      }
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    handleDragEnd,
    addTask,
    updateTask,
    deleteTask,
    loadTasks,
  };
}