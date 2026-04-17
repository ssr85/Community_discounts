import NavBar from '@/components/NavBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
