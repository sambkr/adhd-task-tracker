import type { Task, CreateTaskRequest, UpdateTaskRequest, UserStats, ApiResponse } from '@/types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/python' 
  : 'http://localhost:3000/api/python';

class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async createTask(task: CreateTaskRequest & { user_id: string }): Promise<ApiResponse<Task>> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async getTasks(userId: string): Promise<ApiResponse<Task[]>> {
    const response = await this.request<{ data: Task[] }>(`/tasks/user/${userId}`);
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.data || [] };
  }

  async updateTask(taskId: string, updates: Omit<UpdateTaskRequest, 'id'>): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/tasks/task/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ id: taskId, ...updates }),
    });
  }

  async deleteTask(taskId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/tasks/task/${taskId}`, {
      method: 'DELETE',
    });
  }

  async getUserStats(userId: string): Promise<ApiResponse<UserStats>> {
    return this.request<UserStats>(`/stats/${userId}`);
  }

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();