export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_oklch(0.94_0.04_195),_oklch(0.985_0.004_220)_50%)] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="font-heading text-3xl font-semibold tracking-tight">
            Electro<span className="text-primary">PI</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Task Manager</p>
        </div>
        {children}
      </div>
    </div>
  );
}
