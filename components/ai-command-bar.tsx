"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  full_name?: string;
}

interface AITodo {
  title: string;
  priority?: string;
  assignedUserEmail?: string;
}

interface AICommandBarProps {
  availableUsers: User[];
  onCreateTodos: (todos: Array<{title: string, assignedUserId?: string}>) => Promise<void>;
  onShowTodos: (todoIds: string[]) => void;
  onCompleteTodos: (criteria: string) => Promise<void>;
}

export function AICommandBar({ availableUsers, onCreateTodos, onShowTodos, onCompleteTodos }: AICommandBarProps) {
  const [command, setCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;

    setIsLoading(true);
    const currentCommand = command.trim();
    
    try {
      const response = await fetch('/api/ai/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: currentCommand }),
      });

      if (!response.ok) {
        throw new Error('Failed to process command');
      }

      const data = await response.json();
      
      // Automatically execute the command
      if (data.type === 'function_call') {
        switch (data.function) {
          case 'create_todos':
            const todosToCreate = data.arguments?.todos?.map((todo: AITodo) => {
              const assignedUser = todo.assignedUserEmail 
                ? availableUsers.find(u => u.email === todo.assignedUserEmail)
                : undefined;
              
              return {
                title: todo.title,
                assignedUserId: assignedUser?.id
              };
            });
            if (todosToCreate) {
              await onCreateTodos(todosToCreate);
            }
            break;
          
          case 'show_todos':
            if (data.arguments?.todoIds && data.arguments.todoIds.length > 0) {
              onShowTodos(data.arguments.todoIds);
            }
            break;
          
          case 'complete_todos':
            if (data.arguments?.criteria && typeof data.arguments.criteria === 'string') {
              await onCompleteTodos(data.arguments.criteria);
            }
            break;
        }
        
        // Show success message and clear command
        setLastExecuted(currentCommand);
        setCommand("");
        
        // Clear success message after 3 seconds
        setTimeout(() => setLastExecuted(null), 3000);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      setLastExecuted(`Error: ${currentCommand}`);
      setTimeout(() => setLastExecuted(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative mb-6">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500" />
            <Input
              type="text"
              placeholder="Try: 'Add urgent task to clean garage' or 'Show completed tasks only'"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="pl-10 pr-4"
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            size="icon"
            disabled={!command.trim() || isLoading}
            className="shrink-0 bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        {/* Success Message */}
        <AnimatePresence>
          {lastExecuted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <Check className="w-4 h-4" />
                <span>
                  {lastExecuted.startsWith('Error:') ? (
                    <span className="text-red-700 dark:text-red-300">
                      Failed to process: &ldquo;{lastExecuted.replace('Error: ', '')}&rdquo;
                    </span>
                  ) : (
                    <span>
                      Executed: &ldquo;{lastExecuted}&rdquo;
                    </span>
                  )}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
} 