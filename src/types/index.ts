// Migrated TypeScript interfaces for the ADHD Task Tracker app

export interface PrepStep {
  id?: string;
  title: string;
  offsetMinutes: number;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  category: TaskCategory;
  status: TaskStatus;
  prepSteps: PrepStep[];
  createdAt: string;
  updatedAt?: string;
}

export interface UserStats {
  streakCount: number;
  completionRate: number;
  categoryStats: Record<string, number>;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  category?: TaskCategory;
}

export interface UpdateTaskRequest {
  id: string;
  status?: TaskStatus;
  prepSteps?: PrepStep[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskCategory = 'general' | 'work' | 'personal' | 'health' | 'learning';