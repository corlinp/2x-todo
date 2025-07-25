"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TodoCard } from "./todo-card";
import { AddTodoForm } from "./add-todo-form";
import { motion, AnimatePresence, Reorder } from "framer-motion";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  order_index: number;
  created_at: string;
  user_id: string;
}

export function TodoBoard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadTodos();
    setupRealtimeSubscription();
  }, []);

  const loadTodos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index');

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
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
            setTodos(prev => [...prev, payload.new as Todo].sort((a, b) => a.order_index - b.order_index));
          } else if (payload.eventType === 'UPDATE') {
            setTodos(prev => prev.map(todo => 
              todo.id === payload.new.id ? payload.new as Todo : todo
            ).sort((a, b) => a.order_index - b.order_index));
          } else if (payload.eventType === 'DELETE') {
            setTodos(prev => prev.filter(todo => todo.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addTodo = async (title: string) => {
    try {
      setIsAdding(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const maxOrder = Math.max(...todos.map(t => t.order_index), 0);
      
      const { error } = await supabase
        .from('todos')
        .insert({
          title,
          completed: false,
          order_index: maxOrder + 1,
          user_id: user.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setIsAdding(false);
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

      <AddTodoForm onAdd={addTodo} isLoading={isAdding} />

      {todos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg mb-2">🎯</p>
          <p>No todos yet. Add your first task above!</p>
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
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  );
} 