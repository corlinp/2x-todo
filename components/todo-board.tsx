"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TodoCard } from "./todo-card";
import { AddTodoForm } from "./add-todo-form";
import { AICommandBar } from "./ai-command-bar";
import { AnimatePresence, Reorder } from "framer-motion";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  order_index: number;
  created_at: string;
  user_id: string;
  assigned_user_id: string | null;
}

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  full_name?: string;
}



export function TodoBoard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]); // Store all todos for filtering
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const [shownTodoIds, setShownTodoIds] = useState<string[] | null>(null);
  const supabase = createClient();

  const loadTodos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .or(`user_id.eq.${user.id},assigned_user_id.eq.${user.id}`)
        .order('order_index');

      if (error) throw error;
      const todosData = data || [];
      setAllTodos(todosData);
      setTodos(todosData);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const loadUsers = useCallback(async () => {
    try {
      // Use our API endpoint to get users with Google profile data
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setAvailableUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      // The API endpoint handles all fallbacks, so if it fails, users just won't be available for assignment
    }
  }, []);

  const setupRealtimeSubscription = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('todos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTodo = payload.new as Todo;
            setAllTodos(prev => [...prev, newTodo].sort((a, b) => a.order_index - b.order_index));
            setTodos(prev => [...prev, newTodo].sort((a, b) => a.order_index - b.order_index));
          } else if (payload.eventType === 'UPDATE') {
            const updatedTodo = payload.new as Todo;
            setAllTodos(prev => prev.map(todo => 
              todo.id === updatedTodo.id ? updatedTodo : todo
            ).sort((a, b) => a.order_index - b.order_index));
            setTodos(prev => prev.map(todo => 
              todo.id === updatedTodo.id ? updatedTodo : todo
            ).sort((a, b) => a.order_index - b.order_index));
          } else if (payload.eventType === 'DELETE') {
            setAllTodos(prev => prev.filter(todo => todo.id !== payload.old.id));
            setTodos(prev => prev.filter(todo => todo.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    loadTodos();
    loadUsers();
    setupRealtimeSubscription();
  }, [loadTodos, loadUsers, setupRealtimeSubscription]);

  const addTodo = async (title: string, assignedUserId?: string) => {
    try {
      setIsAdding(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const maxOrder = Math.max(...allTodos.map(t => t.order_index), 0);
      
      const { error } = await supabase
        .from('todos')
        .insert({
          title,
          completed: false,
          order_index: maxOrder + 1,
          user_id: user.id,
          assigned_user_id: assignedUserId || null
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setIsAdding(false);
    }
  };

  // AI-powered batch todo creation
  const createTodos = async (todosToCreate: Array<{title: string, assignedUserId?: string}>) => {
    try {
      setIsAdding(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOrder = Math.max(...allTodos.map(t => t.order_index), 0);
      
      const todosData = todosToCreate.map((todo, index) => ({
        title: todo.title,
        completed: false,
        order_index: startOrder + index + 1,
        user_id: user.id,
        assigned_user_id: todo.assignedUserId || null
      }));

      const { error } = await supabase
        .from('todos')
        .insert(todosData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating todos:', error);
      throw error;
    } finally {
      setIsAdding(false);
    }
  };



  // AI-powered batch completion
  const completeTodos = async (criteria: string) => {
    try {
      // For now, implement basic keyword matching
      // In a more sophisticated implementation, you could use AI to parse criteria
      const todosToComplete = allTodos.filter(todo => {
        if (!todo.completed) {
          const lowerCriteria = criteria.toLowerCase();
          const lowerTitle = todo.title.toLowerCase();
          
          // Simple keyword matching - can be enhanced with AI
          if (lowerCriteria.includes('urgent') || lowerCriteria.includes('high priority')) {
            return lowerTitle.includes('urgent') || lowerTitle.includes('important');
          }
          if (lowerCriteria.includes('kitchen')) {
            return lowerTitle.includes('kitchen');
          }
          if (lowerCriteria.includes('all')) {
            return true;
          }
          
          return lowerTitle.includes(lowerCriteria);
        }
        return false;
      });

      if (todosToComplete.length === 0) {
        throw new Error('No todos found matching the criteria');
      }

      // Update all matching todos
      for (const todo of todosToComplete) {
        await supabase
          .from('todos')
          .update({ completed: true })
          .eq('id', todo.id);
      }
    } catch (error) {
      console.error('Error completing todos:', error);
      throw error;
    }
  };

  const completeTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const updateTodo = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ title })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const reorderTodos = async (newOrder: Todo[]) => {
    // Update local state immediately for smooth UX
    setTodos(newOrder);
    
    // Also update allTodos if no show filter is applied
    if (!shownTodoIds) {
      setAllTodos(newOrder);
    }
    
    try {
      // Update order_index for each todo in the database
      const updates = newOrder.map((todo, index) => ({
        id: todo.id,
        order_index: index
      }));

      for (const update of updates) {
        await supabase
          .from('todos')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error reordering todos:', error);
      // Reload todos to restore correct order on error
      loadTodos();
    }
  };

  // AI-powered todo display
  const showTodos = useCallback((todoIds: string[]) => {
    setShownTodoIds(todoIds);
    const filteredTodos = allTodos.filter(todo => todoIds.includes(todo.id));
    setTodos(filteredTodos);
  }, [allTodos]);

  const clearShow = () => {
    setShownTodoIds(null);
    setTodos(allTodos);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading your todos...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Your Todos</h1>
        <p className="text-sm text-muted-foreground">
          Swipe right to complete • Swipe left to delete • Double-tap to edit • Long-press to reorder
        </p>
      </div>

             <AICommandBar 
         availableUsers={availableUsers}
         onCreateTodos={createTodos}
         onShowTodos={showTodos}
         onCompleteTodos={completeTodos}
       />

      <AddTodoForm onAdd={addTodo} isLoading={isAdding} availableUsers={availableUsers} />

      {shownTodoIds && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-purple-900 dark:text-purple-100">Showing:</span>
              <span className="ml-1 text-purple-700 dark:text-purple-300">
                {shownTodoIds.length} todos
              </span>
            </div>
            <button
              onClick={clearShow}
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-medium"
            >
              Clear show
            </button>
          </div>
        </div>
      )}

      {todos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg mb-2">🎯</p>
          <p>{shownTodoIds ? 'No todos match your selection.' : 'No todos yet. Add your first task above!'}</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={todos}
          onReorder={reorderTodos}
          className="space-y-3"
        >
          <AnimatePresence>
            {todos.map((todo) => (
              <Reorder.Item key={todo.id} value={todo}>
                <TodoCard
                  todo={todo}
                  onComplete={completeTodo}
                  onDelete={deleteTodo}
                  onUpdate={updateTodo}
                  assignedUser={
                    todo.assigned_user_id 
                      ? availableUsers.find(u => u.id === todo.assigned_user_id)
                      : undefined
                  }
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  );
} 