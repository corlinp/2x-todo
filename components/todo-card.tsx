"use client";

import { useState } from "react";
import { motion, PanInfo } from "framer-motion";
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
  const [dragX, setDragX] = useState(0);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 120;
    
    if (info.offset.x > threshold) {
      // Swipe right - complete
      onComplete(todo.id);
    } else if (info.offset.x < -threshold) {
      // Swipe left - delete
      onDelete(todo.id);
    }
    
    setDragX(0);
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

  return (
    <div className="relative group">
      {/* Background actions */}
      <div className="absolute inset-0 flex rounded-lg overflow-hidden">
        <div className="flex-1 bg-green-500/90 flex items-center justify-start pl-4">
          <Check className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 bg-red-500/90 flex items-center justify-end pr-4">
          <Trash2 className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Main card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={(event, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={{ x: dragX }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "bg-card border rounded-lg shadow-sm transition-all duration-200 relative",
          "touch-manipulation select-none cursor-grab active:cursor-grabbing",
          todo.completed && "bg-muted/50"
        )}
        style={{ zIndex: 10 }}
      >
        <div className="flex items-center gap-3 p-4">
          {/* Drag handle */}
          <div className="opacity-30 group-hover:opacity-60 transition-opacity">
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
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  autoFocus
                  onBlur={handleEditCancel}
                  onKeyDown={(e) => e.key === 'Escape' && handleEditCancel()}
                />
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div
                    className={cn(
                      "text-sm cursor-pointer py-1",
                      todo.completed && "line-through text-muted-foreground"
                    )}
                    onDoubleClick={() => !todo.completed && setIsEditing(true)}
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
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        {/* Visual indicators for swipe */}
        {Math.abs(dragX) > 30 && (
          <div className="absolute top-1 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
            {dragX > 0 ? "→ Complete" : "← Delete"}
          </div>
        )}
      </motion.div>
    </div>
  );
} 