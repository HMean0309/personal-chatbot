export default function NewChatPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
          Welcome to Personal AI Chat
        </h1>
        <p className="text-gray-500 dark:text-white/40">Your intelligent assistant is ready.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-2xl w-full px-4">
        {[
          { icon: '<>', title: 'Help me with a Python script', sub: 'Data analysis automation' },
          { icon: '⚗', title: 'Explain quantum physics', sub: 'Simple terms for beginners' },
          { icon: '📄', title: 'Draft a professional email', sub: 'Project update to stakeholders' },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10 cursor-pointer hover:shadow-md dark:hover:bg-white/10 transition"
          >
            <div className="text-gray-400 dark:text-white/30 mb-2">{item.icon}</div>
            <div className="font-medium text-sm text-gray-800 dark:text-white/80">{item.title}</div>
            <div className="text-xs text-gray-400 dark:text-white/30 mt-1">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}