import type { UserStats as UserStatsType } from '@/types';

interface UserStatsProps {
  stats: UserStatsType;
  loading?: boolean;
}

export const UserStats = ({ stats, loading = false }: UserStatsProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStreakMessage = (streak: number): string => {
    if (streak === 0) return "Start your first task!";
    if (streak === 1) return "Great start! 🌱";
    if (streak < 7) return "Building momentum! 🚀";
    if (streak < 30) return "You're on fire! 🔥";
    return "Incredible dedication! 🏆";
  };

  const getCompletionRateColor = (rate: number): string => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const topCategories = Object.entries(stats.categoryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {stats.streakCount}
          </div>
          <div className="text-sm text-gray-600 mb-1">Task Streak</div>
          <div className="text-xs text-gray-500">
            {getStreakMessage(stats.streakCount)}
          </div>
        </div>

        <div className="text-center">
          <div className={`text-3xl font-bold mb-1 ${getCompletionRateColor(stats.completionRate)}`}>
            {Math.round(stats.completionRate)}%
          </div>
          <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
          <div className="text-xs text-gray-500">
            Tasks completed successfully
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {Object.values(stats.categoryStats).reduce((sum, count) => sum + count, 0)}
          </div>
          <div className="text-sm text-gray-600 mb-1">Total Completed</div>
          <div className="text-xs text-gray-500">
            All time achievements
          </div>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Top Categories</h3>
          <div className="space-y-2">
            {topCategories.map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {category}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (count / Math.max(...Object.values(stats.categoryStats))) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.streakCount > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Keep up the great work! You're making excellent progress.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};