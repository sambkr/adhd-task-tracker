import { useState } from 'react';
import type { Task, TaskStatus } from '@/types';
import { Button } from './Button';

interface TaskItemProps {
  task: Task;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

export const TaskItem = ({ task, onUpdateStatus, onDelete }: TaskItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusClasses = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">{task.title}</h3>
            <span className={`border rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(task.status)}`}>
              {getStatusText(task.status)}
            </span>
          </div>
          
          {task.description && (
            <p className="text-gray-600 text-sm mb-2">{task.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {task.dueDate && (
              <span>Due: {formatDate(task.dueDate)}</span>
            )}
            <span className="capitalize">Category: {task.category}</span>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg 
            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          {task.prepSteps.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preparation Steps:</h4>
              <ul className="space-y-1">
                {task.prepSteps.map((step, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {step.title}
                    {step.offsetMinutes && (
                      <span className="ml-2 text-xs text-gray-400">
                        ({step.offsetMinutes > 0 ? '+' : ''}{step.offsetMinutes} min)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            {task.status === 'pending' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onUpdateStatus(task.id, 'in_progress')}
              >
                Start Task
              </Button>
            )}
            
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                variant="success"
                onClick={() => onUpdateStatus(task.id, 'completed')}
              >
                Complete
              </Button>
            )}
            
            <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete(task.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};