"use client";

import { useState, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Check, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  order_index: number;
  assigned_user_id: string | null;
}

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  full_name?: string;
}

interface TodoCardProps {
  todo: Todo;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  assignedUser?: User;
}

export function TodoCard({ todo, onComplete, onDelete, onUpdate, assignedUser }: TodoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Motion values for smooth drag animation
  const x = useMotionValue(0);
  const dragRef = useRef<HTMLDivElement>(null);
  
  // Transform opacity based on drag position for visual feedback
  const completeOpacity = useTransform(x, [0, 100], [0, 1]);
  const deleteOpacity = useTransform(x, [-100, 0], [1, 0]);
  
  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    
    // Prevent multiple rapid gestures
    if (isProcessing) {
      x.set(0);
      return;
    }
    
    // Check for swipe gesture (either distance or velocity based)
    const shouldComplete = offset > threshold || (velocity > 500 && offset > 50);
    const shouldDelete = offset < -threshold || (velocity < -500 && offset < -50);
    
    if (shouldComplete && !todo.completed) {
      setIsProcessing(true);
      try {
        // Animate to completion position
        await x.set(300);
        onComplete(todo.id);
      } catch (error) {
        console.error('Error completing todo:', error);
        x.set(0);
      } finally {
        setIsProcessing(false);
      }
    } else if (shouldDelete) {
      setIsProcessing(true);
      try {
        // Animate to delete position
        await x.set(-300);
        onDelete(todo.id);
      } catch (error) {
        console.error('Error deleting todo:', error);
        x.set(0);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Spring back to center
      x.set(0);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim() && editTitle !== todo.title) {
      onUpdate(todo.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  const handleDoubleClick = () => {
    if (!todo.completed && !isProcessing) {
      setIsEditing(true);
    }
  };

  return (
    <div className="relative group">
      {/* Background actions with dynamic opacity */}
      <div className="absolute inset-0 flex rounded-lg overflow-hidden pointer-events-none">
        <motion.div 
          className="flex-1 bg-green-500/90 flex items-center justify-start pl-4"
          style={{ opacity: completeOpacity }}
        >
          <Check className="w-6 h-6 text-white" />
          <span className="ml-2 text-white font-medium">Complete</span>
        </motion.div>
        <motion.div 
          className="flex-1 bg-red-500/90 flex items-center justify-end pr-4"
          style={{ opacity: deleteOpacity }}
        >
          <span className="mr-2 text-white font-medium">Delete</span>
          <Trash2 className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      {/* Main card */}
      <motion.div
        ref={dragRef}
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x, zIndex: 10 }}
        whileTap={{ scale: 0.98 }}
        animate={isProcessing ? {} : { x: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className={cn(
          "bg-card border rounded-lg shadow-sm transition-all duration-200 relative",
          "touch-manipulation select-none cursor-grab active:cursor-grabbing",
          todo.completed && "bg-muted/50",
          isProcessing && "pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3 p-4">
          {/* Drag handle */}
          <div className="opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm focus:ring-0"
                  autoFocus
                  onBlur={handleEditCancel}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleEditCancel();
                    e.stopPropagation();
                  }}
                />
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div
                    className={cn(
                      "text-sm cursor-pointer py-1 user-select-none",
                      todo.completed && "line-through text-muted-foreground"
                    )}
                    onDoubleClick={handleDoubleClick}
                  >
                    {todo.title}
                  </div>
                  {assignedUser && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Assigned to {assignedUser.name || assignedUser.full_name || assignedUser.email}
                    </div>
                  )}
                </div>
                {assignedUser && (
                  <UserAvatar user={assignedUser} size="sm" />
                )}
              </div>
            )}
          </div>

          {/* Status indicator */}
          {todo.completed && (
            <motion.div 
              className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 