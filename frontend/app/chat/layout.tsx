import Sidebar from '@/app/components/sidebar/Sidebar';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f5f5f0] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-white dark:bg-[#25253a]">{children}</main>
    </div>
  );
}