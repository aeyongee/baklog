export default function Loading() {
  return (
    <main className="p-4 max-w-4xl mx-auto">
      <div className="mb-5 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
      </div>
      
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
        ))}
      </div>
    </main>
  );
}
