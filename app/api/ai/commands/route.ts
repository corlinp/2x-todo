import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the function schemas for OpenAI
const functions = [
  {
    name: 'create_todos',
    description: 'Create one or more new todos',
    parameters: {
      type: 'object',
      properties: {
        todos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'The todo title/description'
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'urgent'],
                description: 'Priority level of the todo'
              },
              assignedUserEmail: {
                type: 'string',
                description: 'Email of user to assign this todo to (optional)'
              }
            },
            required: ['title']
          }
        }
      },
      required: ['todos']
    }
  },
  {
    name: 'show_todos',
    description: 'Display specific todos by analyzing all available todos and returning the IDs that match the user request',
    parameters: {
      type: 'object',
      properties: {
        todoIds: {
          type: 'array',
          items: {
            type: 'string',
            description: 'ID of a todo to display'
          },
          description: 'Array of todo IDs to display to the user'
        },
        reasoning: {
          type: 'string',
          description: 'Brief explanation of why these todos were selected'
        }
      },
      required: ['todoIds']
    }
  },
  {
    name: 'complete_todos',
    description: 'Mark todos as complete based on description',
    parameters: {
      type: 'object',
      properties: {
        criteria: {
          type: 'string',
          description: 'Description of which todos to complete (e.g., "all kitchen tasks", "urgent items")'
        }
      },
      required: ['criteria']
    }
  }
];

export async function POST(request: Request) {
  try {
    const { command } = await request.json();
    
    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    // Get current user and todos for context
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current todos for context
    const { data: todos } = await supabase
      .from('todos')
      .select('*')
      .or(`user_id.eq.${user.id},assigned_user_id.eq.${user.id}`)
      .order('order_index');

    // Get available users for assignment from profiles table
    let users: Array<{id: string, email: string, name?: string, full_name?: string}> = [];
    let userInfo = '';
    
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, email, name, full_name')
        .limit(50);
      
      if (!error && profilesData) {
        users = profilesData;
        userInfo = users.map(u => `${u.name || u.full_name || u.email} (${u.email})`).join(', ');
      }
    } catch (error) {
      console.error('Error loading users for AI context:', error);
    }

    // Create context message for OpenAI
    const contextMessage = `Current todos: ${JSON.stringify(todos || [])}
Available users for assignment: ${userInfo}
Current user email: ${user.email}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a todo app. Parse user commands and call appropriate functions.
          
Context: ${contextMessage}

Guidelines:
- For creating todos, extract clear, actionable titles
- Infer priority from keywords like "urgent", "asap", "important", "later", "minor"
- For multiple todos in one command, create separate items
- For user assignment, look for patterns like "assign to [name]", "for [name]", "[name] should do", "give [name]"
- Match user assignments to available emails (case-insensitive, partial matches OK)
- For showing/filtering todos, analyze ALL available todos in the context and return the specific IDs that match the user's request
- Use show_todos to display specific todos based on any criteria (keyword, priority, status, assignment, etc.)
- Always preserve the user's original intent while making it actionable

User Assignment Examples:
"Add urgent task to clean garage for john@company.com" → assign to john@company.com
"Tell Sarah to review the documents" → assign to closest matching email containing "sarah"
"Give the meeting prep to mike" → assign to closest matching email containing "mike"
"John should clean the kitchen and Mary should take out trash" → 2 todos with respective assignments

Show/Filter Examples:
"Show kitchen chores only" → show_todos with IDs of todos containing "kitchen"
"Show urgent tasks" → show_todos with IDs of todos with high/urgent priority
"Show my completed tasks" → show_todos with IDs of completed todos assigned to current user
"Show everything Sarah is working on" → show_todos with IDs of todos assigned to Sarah

Other Examples:
"Add 'Clean the gutters' urgent" → create_todos with high priority
"I need to clean the kitchen and take out trash" → create_todos with 2 items
"Complete all urgent tasks" → complete_todos with criteria "urgent"`
        },
        {
          role: 'user',
          content: command
        }
      ],
      functions: functions,
      function_call: 'auto',
      temperature: 0.1
    });

    const choice = completion.choices[0];
    
    if (!choice.message.function_call) {
      return NextResponse.json({
        type: 'message',
        content: choice.message.content || 'I didn\'t understand that command. Try something like "Add urgent task to clean garage" or "Show completed tasks only".'
      });
    }

    const functionCall = choice.message.function_call;
    const functionArgs = JSON.parse(functionCall.arguments);

    // Return the parsed command for preview
    return NextResponse.json({
      type: 'function_call',
      function: functionCall.name,
      arguments: functionArgs,
      preview: generatePreview(functionCall.name, functionArgs, todos || []),
      raw_command: command
    });

  } catch (error) {
    console.error('AI command error:', error);
    return NextResponse.json(
      { error: 'Failed to process command' },
      { status: 500 }
    );
  }
}

interface CreateTodosArgs {
  todos: Array<{
    title: string;
    priority?: string;
    assignedUserEmail?: string;
  }>;
}

interface ShowTodosArgs {
  todoIds: string[];
  reasoning?: string;
}

interface CompleteTodosArgs {
  criteria: string;
}

function generatePreview(functionName: string, args: CreateTodosArgs | ShowTodosArgs | CompleteTodosArgs, allTodos: any[] = []) {
  switch (functionName) {
    case 'create_todos':
      const createArgs = args as CreateTodosArgs;
      const todoCount = createArgs.todos.length;
      const todoTitles = createArgs.todos.map((t) => `• ${t.title}`).join('\n');
      return {
        title: `Create ${todoCount} new todo${todoCount > 1 ? 's' : ''}`,
        description: todoTitles,
        action: 'create'
      };
    
    case 'show_todos':
      const showArgs = args as ShowTodosArgs;
      const todoIds = showArgs.todoIds;
      const todoTitlesForPreview = todoIds.map(id => {
        const todo = allTodos.find((t: any) => t.id === id);
        return todo ? `• ${todo.title}` : `• Todo ID ${id}`;
      }).join('\n');
      return {
        title: `Display ${todoIds.length} todo${todoIds.length > 1 ? 's' : ''}`,
        description: todoTitlesForPreview,
        action: 'show'
      };
    
    case 'complete_todos':
      const completeArgs = args as CompleteTodosArgs;
      return {
        title: 'Complete todos',
        description: `Mark as complete: ${completeArgs.criteria}`,
        action: 'complete'
      };
    
    default:
      return {
        title: 'Unknown action',
        description: 'Unable to preview this action',
        action: 'unknown'
      };
  }
} 