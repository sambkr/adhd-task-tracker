'use client';

import { useState, useEffect } from "react";
import type { Task, UserStats, CreateTaskRequest, TaskStatus } from "@/types";
import { apiClient } from "@/lib/api";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { UserStats as UserStatsComponent } from "@/components/UserStats";

type View = 'tasks' | 'stats';

// For MVP, we'll use a mock user ID. In production, this would come from authentication
const MOCK_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function App() {
  const [currentView, setCurrentView] = useState<View>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    streakCount: 0,
    completionRate: 0,
    categoryStats: {}
  });
  const [loading, setLoading] = useState({
    tasks: false,
    stats: false,
    createTask: false
  });
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(prev => ({ ...prev, tasks: true }));
      setError(null);
      const response = await apiClient.getTasks(MOCK_USER_ID);
      if (response.error) {
        throw new Error(response.error);
      }
      setTasks(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  const loadUserStats = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      const response = await apiClient.getUserStats(MOCK_USER_ID);
      if (response.error) {
        throw new Error(response.error);
      }
      setUserStats(response.data || { streakCount: 0, completionRate: 0, categoryStats: {} });
    } catch (err) {
      console.error('Error loading user stats:', err);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  useEffect(() => {
    loadTasks();
    loadUserStats();
  }, []);

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    try {
      setLoading(prev => ({ ...prev, createTask: true }));
      setError(null);
      const response = await apiClient.createTask({
        ...taskData,
        user_id: MOCK_USER_ID
      });
      if (response.error) {
        throw new Error(response.error);
      }
      await loadTasks();
      await loadUserStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      console.error('Error creating task:', err);
    } finally {
      setLoading(prev => ({ ...prev, createTask: false }));
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const response = await apiClient.updateTask(taskId, { status });
      if (response.error) {
        throw new Error(response.error);
      }
      await loadTasks();
      await loadUserStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await apiClient.deleteTask(taskId);
      if (response.error) {
        throw new Error(response.error);
      }
      await loadTasks();
      await loadUserStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              ADHD Task Tracker
            </h1>
            
            <nav className="flex gap-2">
              <button
                onClick={() => setCurrentView('tasks')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'tasks'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setCurrentView('stats')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'stats'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Progress
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {currentView === 'tasks' && (
          <div className="space-y-6">
            <TaskForm
              onSubmit={handleCreateTask}
              loading={loading.createTask}
            />
            
            <TaskList
              tasks={tasks}
              onUpdateStatus={handleUpdateTaskStatus}
              onDelete={handleDeleteTask}
              loading={loading.tasks}
            />
          </div>
        )}

        {currentView === 'stats' && (
          <UserStatsComponent
            stats={userStats}
            loading={loading.stats}
          />
        )}
      </main>
    </div>
  );
}