import { AuthButton } from "@/components/auth-button";
import { Logo } from "@/components/logo";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Logo size="sm" linkTo="/protected" />
          </div>
          <AuthButton />
        </div>
      </nav>
      <div className="flex-1 w-full max-w-md mx-auto p-4">
        {children}
      </div>
    </main>
  );
}
