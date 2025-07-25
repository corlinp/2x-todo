import { AuthButton } from "@/components/auth-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, redirect to todos
  if (user) {
    redirect("/protected");
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>2xTODO</Link>
            </div>
            <AuthButton />
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="flex flex-col items-center text-center space-y-6">
            <h1 className="text-6xl font-bold tracking-tight">2xTODO</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Double your productivity with a minimalist, real-time, AI-assisted to-do board
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link 
                href="/auth/sign-up"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
              <Link 
                href="/auth/login"
                className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div className="space-y-2">
              <div className="text-2xl">👆</div>
              <h3 className="font-semibold">Natural Gestures</h3>
              <p className="text-sm text-muted-foreground">
                Swipe right to complete, swipe left to delete, long-press to reorder
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">⚡</div>
              <h3 className="font-semibold">Real-time Sync</h3>
              <p className="text-sm text-muted-foreground">
                Changes sync instantly across all your devices
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">📱</div>
              <h3 className="font-semibold">Mobile First</h3>
              <p className="text-sm text-muted-foreground">
                Designed for touch, optimized for speed
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
