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
    name: 'filter_todos',
    description: 'Filter and display todos based on criteria',
    parameters: {
      type: 'object',
      properties: {
        criteria: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Keyword to search for in todo titles'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Filter by priority level'
            },
            completed: {
              type: 'boolean',
              description: 'Filter by completion status'
            },
            assignedToMe: {
              type: 'boolean',
              description: 'Show only todos assigned to current user'
            },
            createdByMe: {
              type: 'boolean',
              description: 'Show only todos created by current user'
            }
          }
        }
      },
      required: ['criteria']
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
- For filtering, interpret natural language into specific criteria
- Always preserve the user's original intent while making it actionable

User Assignment Examples:
"Add urgent task to clean garage for john@company.com" → assign to john@company.com
"Tell Sarah to review the documents" → assign to closest matching email containing "sarah"
"Give the meeting prep to mike" → assign to closest matching email containing "mike"
"John should clean the kitchen and Mary should take out trash" → 2 todos with respective assignments

Other Examples:
"Add 'Clean the gutters' urgent" → create_todos with high priority
"I need to clean the kitchen and take out trash" → create_todos with 2 items
"Show kitchen chores only" → filter_todos with keyword "kitchen"
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
      preview: generatePreview(functionCall.name, functionArgs),
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

interface FilterTodosArgs {
  criteria: {
    keyword?: string;
    priority?: string;
    completed?: boolean;
    assignedToMe?: boolean;
    createdByMe?: boolean;
  };
}

interface CompleteTodosArgs {
  criteria: string;
}

function generatePreview(functionName: string, args: CreateTodosArgs | FilterTodosArgs | CompleteTodosArgs) {
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
    
    case 'filter_todos':
      const filterArgs = args as FilterTodosArgs;
      const criteria = filterArgs.criteria;
      const filters = Object.entries(criteria)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return {
        title: 'Filter todos',
        description: `Show todos matching: ${filters}`,
        action: 'filter'
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