"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
}

interface AddTodoFormProps {
  onAdd: (title: string, assignedUserId?: string) => void;
  isLoading?: boolean;
  availableUsers?: User[];
}

export function AddTodoForm({ onAdd, isLoading = false, availableUsers = [] }: AddTodoFormProps) {
  const [title, setTitle] = useState("");
  const [assignedUserId, setAssignedUserId] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), assignedUserId);
      setTitle("");
      setAssignedUserId(undefined);
    }
  };

  const getAssignedUserEmail = () => {
    if (!assignedUserId) return "Assign to user";
    const user = availableUsers.find(u => u.id === assignedUserId);
    return user ? user.email : "Assign to user";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-6">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Add a new todo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!title.trim() || isLoading}
          className="shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {availableUsers.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start text-left"
              type="button"
              disabled={isLoading}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {getAssignedUserEmail()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            <DropdownMenuLabel>Assign to user</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setAssignedUserId(undefined)}
              className={assignedUserId === undefined ? "bg-accent" : ""}
            >
              No assignment
            </DropdownMenuItem>
            {availableUsers.map((user) => (
              <DropdownMenuItem 
                key={user.id}
                onClick={() => setAssignedUserId(user.id)}
                className={assignedUserId === user.id ? "bg-accent" : ""}
              >
                {user.email}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </form>
  );
} 