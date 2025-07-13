import { useState } from 'react';
import type { CreateTaskRequest, TaskCategory } from '@/types';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';

interface TaskFormProps {
  onSubmit: (task: CreateTaskRequest) => void;
  loading?: boolean;
}

const categoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' }
];

export const TaskForm = ({ onSubmit, loading = false }: TaskFormProps) => {
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    dueDate: '',
    category: 'general'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateTaskRequest, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateTaskRequest, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const now = new Date();
      if (dueDate < now) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        category: 'general'
      });
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof CreateTaskRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getDefaultDueDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return formatDateTimeLocal(tomorrow);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Task</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="title"
          label="Task Title"
          placeholder="What do you need to do?"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={errors.title}
          required
        />

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            id="description"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none text-gray-900 placeholder-gray-400 focus:placeholder-gray-300 px-3 py-2"
            placeholder="Add any additional details..."
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
        </div>

        <Input
          id="dueDate"
          type="datetime-local"
          label="Due Date (Optional)"
          value={formData.dueDate || getDefaultDueDate()}
          onChange={(e) => handleInputChange('dueDate', e.target.value)}
          error={errors.dueDate}
          helperText="AI will generate helpful preparation reminders based on this date"
        />

        <Select
          id="category"
          label="Category"
          options={categoryOptions}
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value as TaskCategory)}
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            loading={loading}
            disabled={!formData.title.trim()}
          >
            Create Task
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                dueDate: '',
                category: 'general'
              });
              setErrors({});
            }}
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
};