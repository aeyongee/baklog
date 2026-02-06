export default function Loading() {
  return (
    <main className="mx-auto max-w-lg p-4">
      <div className="animate-pulse">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
        
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
        
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    </main>
  );
}
