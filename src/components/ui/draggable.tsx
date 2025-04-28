
import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Move } from "lucide-react";

interface DraggableProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  dragHandleElement?: React.ReactNode;
}

export function Draggable({
  id,
  children,
  index,
  onReorder,
  dragHandleElement,
  className,
  ...props
}: React.PropsWithChildren<DraggableProps>) {
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const originalIndexRef = useRef<number>(index);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    
    // Use a custom drag image if possible
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      dragStartPosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      
      // Create a clone of the element being dragged for the drag image
      try {
        // This can fail in some browsers, so we'll catch errors
        const ghost = elementRef.current.cloneNode(true) as HTMLDivElement;
        ghost.style.opacity = "0.5";
        ghost.style.position = "absolute";
        ghost.style.top = "-1000px";
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, dragStartPosRef.current.x, dragStartPosRef.current.y);
        setTimeout(() => {
          document.body.removeChild(ghost);
        }, 0);
      } catch (error) {
        console.error("Failed to set custom drag image:", error);
      }
    }

    originalIndexRef.current = index;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedItemId = e.dataTransfer.getData("text/plain");
    if (droppedItemId !== id) {
      onReorder(originalIndexRef.current, index);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={elementRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={cn(
        "transition-colors",
        isDragging && "opacity-50 border-dashed",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="drag-handle cursor-move flex items-center justify-center">
          {dragHandleElement || <Move className="h-4 w-4 text-muted-foreground" />}
        </div>
        {children}
      </div>
    </div>
  );
}

export function DraggableList<T extends { id: string }>({
  items,
  renderItem,
  onReorder,
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onReorder: (fromIndex: number, toIndex: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <Draggable 
          key={item.id} 
          id={item.id} 
          index={index} 
          onReorder={onReorder}
        >
          {renderItem(item, index)}
        </Draggable>
      ))}
    </div>
  );
}
