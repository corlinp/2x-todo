# 2xTODO - Double Your Productivity

A minimalist, real-time, AI-assisted to-do board built with Next.js 15, Supabase, and shadcn/ui.

## ✨ Features

- **Zero-friction board**: A single, vertically stacked column of task cards—nothing to configure, instantly familiar
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
```

Both values can be found in your [Supabase project's API settings](https://supabase.com/dashboard/project/_/settings/api).

### 3. Set Up Database

In your Supabase dashboard, go to the SQL Editor and run the contents of `supabase-schema.sql`:

```sql
-- This will create the todos table, enable RLS, set up policies, and configure real-time subscriptions
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see 2xTODO in action!

## 📱 How to Use

1. **Sign up** or **sign in** with email or Google
2. **Add todos** by typing in the input field and pressing Enter
3. **Complete todos** by swiping right ➡️
4. **Delete todos** by swiping left ⬅️
5. **Edit todos** by double-tapping the text
6. **Reorder todos** by long-pressing and dragging

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
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

- Row Level Security (RLS) ensures users only see their own todos
- Secure authentication with Supabase Auth
- Real-time subscriptions are user-scoped

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
