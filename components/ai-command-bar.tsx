"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Send, X, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAvatar } from "./user-avatar";

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  full_name?: string;
}



interface FilterCriteria {
  keyword?: string;
  priority?: string;
  completed?: boolean;
  assignedToMe?: boolean;
  createdByMe?: boolean;
}

interface AICommandBarProps {
  availableUsers: User[];
  onCreateTodos: (todos: Array<{title: string, assignedUserId?: string}>) => Promise<void>;
  onFilterTodos: (criteria: FilterCriteria) => void;
  onCompleteTodos: (criteria: string) => Promise<void>;
}

interface PreviewData {
  type: 'function_call' | 'message';
  function?: string;
  arguments?: {
    todos?: Array<{
      title: string;
      priority?: string;
      assignedUserEmail?: string;
    }>;
    criteria?: FilterCriteria | string;
  };
  preview?: {
    title: string;
    description: string;
    action: string;
  };
  content?: string;
  raw_command: string;
}

export function AICommandBar({ availableUsers, onCreateTodos, onFilterTodos, onCompleteTodos }: AICommandBarProps) {
  const [command, setCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: command.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to process command');
      }

      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Error processing command:', error);
      setPreviewData({
        type: 'message',
        content: 'Sorry, I couldn\'t process that command. Please try again.',
        raw_command: command
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!previewData || previewData.type !== 'function_call') return;

    setIsApplying(true);
    try {
      switch (previewData.function) {
        case 'create_todos':
          const todosToCreate = previewData.arguments?.todos?.map((todo) => {
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
        
        case 'filter_todos':
          if (previewData.arguments?.criteria && typeof previewData.arguments.criteria !== 'string') {
            onFilterTodos(previewData.arguments.criteria);
          }
          break;
        
        case 'complete_todos':
          if (previewData.arguments?.criteria && typeof previewData.arguments.criteria === 'string') {
            await onCompleteTodos(previewData.arguments.criteria);
          }
          break;
      }
      
      // Clear the command and preview
      setCommand("");
      setPreviewData(null);
    } catch (error) {
      console.error('Error applying command:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    {previewData.type === 'function_call' ? 'AI Command Preview' : 'AI Response'}
                  </CardTitle>
                  <CardDescription>
                    &ldquo;{previewData.raw_command}&rdquo;
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {previewData.type === 'function_call' && previewData.preview ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-2">
                          {previewData.preview.title}
                        </h3>
                        <div className="text-sm whitespace-pre-line">
                          {previewData.preview.description}
                        </div>
                      </div>
                      
                      {/* Show additional details for create_todos */}
                      {previewData.function === 'create_todos' && previewData.arguments?.todos && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-muted-foreground">Todo Details:</h4>
                                                     {previewData.arguments.todos?.map((todo, index: number) => (
                             <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                               <div className="flex-1">{todo.title}</div>
                               <div className="flex gap-2 items-center">
                                 {todo.priority && (
                                   <Badge variant="secondary" className={getPriorityColor(todo.priority)}>
                                     {todo.priority}
                                   </Badge>
                                 )}
                                 {todo.assignedUserEmail && (
                                   <div className="flex items-center gap-1">
                                     {(() => {
                                       const assignedUser = availableUsers.find(u => u.email === todo.assignedUserEmail);
                                       if (assignedUser) {
                                         return (
                                           <>
                                             <UserAvatar user={assignedUser} size="sm" />
                                             <span className="text-xs text-muted-foreground">
                                               {assignedUser.name || assignedUser.full_name || assignedUser.email.split('@')[0]}
                                             </span>
                                           </>
                                         );
                                       }
                                       return (
                                         <span className="text-xs text-muted-foreground">
                                           {todo.assignedUserEmail}
                                         </span>
                                       );
                                     })()}
                                   </div>
                                 )}
                               </div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {previewData.content}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                    disabled={isApplying}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  
                  {previewData.type === 'function_call' && (
                    <Button
                      onClick={handleApply}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      disabled={isApplying}
                    >
                      {isApplying ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Apply
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 