'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  useDroppable,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
} from '@dnd-kit/core';
import type { CollisionDetection, UniqueIdentifier } from '@dnd-kit/core';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import React, { useState, useCallback, useRef, useEffect } from 'react';

export type { DragEndEvent } from '@dnd-kit/core';

export type Status = {
  id: string;
  name: string;
  color: string;
};

export type KanbanItem = {
  id: UniqueIdentifier;
  name: string;
  data?: any;
};

export type KanbanContainerProps = {
  id: UniqueIdentifier;
  children: ReactNode;
  className?: string;
  title?: string;
  color?: string;
  items: UniqueIdentifier[];
};

export const KanbanContainer = ({ id, children, className, title, color, items }: KanbanContainerProps) => {
  const { 
    setNodeRef, 
    active,
    over,
  } = useDroppable({ 
    id,
    data: {
      type: 'container',
      children: items,
    }
  });

  const isOverContainer = over
    ? (id === over.id && active?.data.current?.type !== 'container') ||
      items.includes(over.id)
    : false;

  return (
    <div
      className={cn(
        'flex h-full min-h-40 flex-col gap-2 rounded-md border bg-secondary p-2 text-xs shadow-sm outline outline-2 transition-all duration-200',
        isOverContainer ? 'drop-zone-active' : 'outline-transparent',
        className
      )}
      ref={setNodeRef}
    >
      {title && (
        <div className="flex shrink-0 items-center gap-2 p-2">
          {color && (
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          <p className="m-0 font-semibold text-sm">{title}</p>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2">
        {children}
      </div>
    </div>
  );
};

export type KanbanCardProps = {
  id: UniqueIdentifier;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  handle?: boolean;
  disabled?: boolean;
};

export const KanbanCard = ({
  id,
  children,
  className,
  onClick,
  handle = false,
  disabled = false,
}: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });


  return (
    <Card
      className={cn(
        'rounded-md p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
        isDragging && 'dragging',
        className
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : 'auto',
      }}
      ref={disabled ? undefined : setNodeRef}
      onClick={onClick}
    >
      {React.isValidElement(children) ? 
        React.cloneElement(children as React.ReactElement<any>, { 
          dragHandleProps: handle ? {
            ref: setActivatorNodeRef,
            ...listeners,
            ...attributes,
          } : undefined
        }) : 
        <div {...(handle ? {} : { ...listeners, ...attributes })} className="cursor-move">
          <p className="m-0 font-medium text-sm">{id}</p>
        </div>
      }
    </Card>
  );
};

export type KanbanProviderProps = {
  children: ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
  items: Record<UniqueIdentifier, UniqueIdentifier[]>;
  className?: string;
  handle?: boolean;
};

export const KanbanProvider = ({
  children,
  onDragEnd,
  items,
  className,
}: KanbanProviderProps) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { 
        distance: 3,
      },
    })
  );

  const findContainer = (id: UniqueIdentifier) => {
    if (id in items) {
      return id;
    }
    return Object.keys(items).find((key) => items[key].includes(id));
  };


  /**
   * Custom collision detection strategy optimized for multiple containers
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      if (activeId && activeId in items) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) => container.id in items
          ),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');

      if (overId != null) {
        if (overId in items) {
          const containerItems = items[overId];

          // If a container is matched and it contains items
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) =>
                  container.id !== overId &&
                  containerItems.includes(container.id)
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;
        return [{ id: overId }];
      }

      // When a draggable item moves to a new container, the layout may shift
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, items]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    haptics.medium();
    haptics.dragStart();
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (overId == null || active.id in items) {
      return;
    }

    const overContainer = findContainer(overId);
    const activeContainer = findContainer(active.id);

    if (!overContainer || !activeContainer) {
      return;
    }

    if (activeContainer !== overContainer) {
      // Light haptic feedback when hovering over different containers
      haptics.dragHover();
      
      // This will be handled by the parent component through onDragEnd
      // We don't modify items here, just provide haptic feedback
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Success haptic feedback on successful drop
    if (over && active.id !== over.id) {
      haptics.success();
    } else if (!over) {
      // Error feedback if dropped in invalid area
      haptics.error();
    }
    
    setActiveId(null);
    onDragEnd(event);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  const renderDragOverlay = () => {
    if (!activeId) return null;

    const container = findContainer(activeId);
    if (!container) return null;

    return (
      <Card className="rounded-md p-3 shadow-2xl opacity-90 rotate-6 scale-110 bg-card border-2 border-primary">
        <p className="m-0 font-medium text-sm">Dragging item...</p>
      </Card>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className={cn(
          'grid w-full auto-cols-fr grid-flow-col gap-4 p-4',
          className
        )}
      >
        {children}
      </div>
      <DragOverlay
        dropAnimation={{
          duration: 300,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {renderDragOverlay()}
      </DragOverlay>
    </DndContext>
  );
};