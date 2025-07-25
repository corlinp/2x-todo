# 2xTODO - Double Your Productivity

A minimalist, real-time, AI-assisted to-do board built with Next.js 15, Supabase, and shadcn/ui.

## ✨ Features

- **AI-First Interface**: Pure AI command bar - no manual input needed! Type natural language commands like "Tell Sarah to clean garage urgent" or "Show completed tasks only" - GPT-4o parses your intent, understands user assignments, and previews changes before applying them
- **Zero-friction board**: A single, vertically stacked column of task cards—nothing to configure, instantly familiar
- **Smart user assignment**: Assign todos via AI commands only ("Give Mike the meeting prep"), with visual avatars showing initials
- **Natural gestures**:
  - 👉 Swipe right → mark complete
  - 👈 Swipe left → delete
  - ✏️ Double-tap → edit
  - 🔄 Long-press + drag → reorder with smooth animations
- **Real-time sync**: Changes sync instantly across all your devices
- **Mobile-first**: Optimized for touch with buttery-smooth interactions
- **Secure**: User authentication with Row Level Security (RLS)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A [Supabase](https://supabase.com) account and project

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd 2xai
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

The Supabase values can be found in your [Supabase project's API settings](https://supabase.com/dashboard/project/_/settings/api).

For the OpenAI API key, get one from your [OpenAI dashboard](https://platform.openai.com/api-keys).

### 3. Set Up Database

In your Supabase dashboard, go to the SQL Editor and run the contents of `supabase-schema.sql`:

```sql
-- This will create the todos table, profiles table with Google profile data,
-- enable RLS, set up policies, configure real-time subscriptions,
-- and automatically sync Google profile pictures and names from OAuth
```

The schema includes:
- **Todos table** with user assignment support
- **Profiles table** that automatically syncs Google profile data (names, avatars)
- **Triggers** that keep profiles updated when users sign in with Google
- **RLS policies** for secure data access

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see 2xTODO in action!

## 📱 How to Use

1. **Sign up** or **sign in** with email or Google
2. **Use AI commands** with natural language - this is the only way to interact with your todos:
   - "Add urgent task to clean garage" → Creates a high-priority todo
   - "Tell Sarah to review the documents" → Creates todo assigned to Sarah
   - "John should clean kitchen and Mary take out trash" → Creates 2 todos with assignments
   - "I need to clean the kitchen and take out trash" → Creates 2 separate todos
   - "Show kitchen chores only" → Filters todos by keyword
   - "Complete all urgent tasks" → Marks matching todos as done
3. **Complete todos** by swiping right ➡️ (works for both owned and assigned todos)
4. **Delete todos** by swiping left ⬅️
5. **Edit todos** by double-tapping the text
6. **Reorder todos** by long-pressing and dragging

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **AI**: OpenAI GPT-4o with function calling for natural language processing
- **Styling**: Tailwind CSS, shadcn/ui
- **Animations**: Framer Motion
- **Backend**: Supabase (Auth + Database + Real-time)
- **Gestures**: Custom touch handlers for mobile-first UX

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/2xai)

1. Connect your GitHub repository
2. Add your Supabase environment variables
3. Deploy!

### Deploy Anywhere

```bash
npm run build
npm start
```

## 🔒 Security

- Row Level Security (RLS) ensures users only see their own todos and todos assigned to them
- Secure authentication with Supabase Auth
- Real-time subscriptions are user-scoped
- Assignment permissions: only todo creators can assign todos to others

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for productivity enthusiasts. Double your productivity with 2xTODO!
