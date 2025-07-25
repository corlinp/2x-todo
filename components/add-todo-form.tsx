"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface AddTodoFormProps {
  onAdd: (title: string) => void;
  isLoading?: boolean;
}

export function AddTodoForm({ onAdd, isLoading = false }: AddTodoFormProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
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
    </form>
  );
} 