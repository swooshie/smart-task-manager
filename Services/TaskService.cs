using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;
using TodoApp.Api.Services.Interfaces;
using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;

    public TaskService(ITaskRepository taskRepository)
    {
        _taskRepository = taskRepository;
    }

    public async Task<List<TaskItem>> GetTasksByUserIdAsync(string userId)
    {
        return await _taskRepository.GetByUserIdAsync(userId);
    }

    public async Task<TaskItem> CreateTaskAsync(string userId, CreateTaskRequest request)
    {
        var task = new TaskItem
        {
            UserId = userId,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority ?? "medium",
            Category = request.Category,
            DueDate = request.DueDate,
            IsComplete = false,
            CreatedAt = DateTime.UtcNow
        };

        await _taskRepository.CreateAsync(task);
        return task;
    }
    public async Task<TaskItem> UpdateTaskAsync(string userId, string taskId, UpdateTaskRequest request)
    {
        var existingTask = await _taskRepository.GetByIdAsync(taskId);
        if (existingTask == null || existingTask.UserId != userId)
        {
            return null; // Or throw an exception if you prefer
        }

        if (!string.IsNullOrEmpty(request.Title))
        {
            existingTask.Title = request.Title;
        }
        if(request.Description != null)
        {
            existingTask.Description = request.Description;
        }
        if(request.IsComplete.HasValue && request.IsComplete.Value != existingTask.IsComplete)
        {
            existingTask.IsComplete = request.IsComplete.Value;
        }
        if (request.Priority != null)
        {
            existingTask.Priority = request.Priority;
        }
        if (request.Category != null)
        {
            existingTask.Category = request.Category;
        }
        if (request.DueDate.HasValue)
        {
            existingTask.DueDate = request.DueDate;
        }

        existingTask.UpdatedAt = DateTime.UtcNow;

        await _taskRepository.UpdateAsync(existingTask);
        return existingTask;
    }

    public async Task<bool> DeleteTaskAsync(string userId, string taskId)
    {
        var existingTask = await _taskRepository.GetByIdAsync(taskId);
        if (existingTask == null || existingTask.UserId != userId)
        {
            return false; // Or throw an exception if you prefer
        }

        await _taskRepository.DeleteAsync(taskId);
        return true;
    }
}