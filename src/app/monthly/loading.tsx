export default function MonthlyLoading() {
  return (
    <main className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="mt-2 h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <div
                  key={dayIndex}
                  className="aspect-square bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
