using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;
using TodoApp.Api.Services.Interfaces;
using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly ICacheService _cacheService;

    public TaskService(ITaskRepository taskRepository, ICacheService cacheService)
    {
        _taskRepository = taskRepository;
        _cacheService = cacheService;
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
            PlaceId = request.LocationReminderEnabled ? request.PlaceId : null,
            LocationReminderEnabled = request.LocationReminderEnabled && !string.IsNullOrWhiteSpace(request.PlaceId),
            DueDate = request.DueDate,
            IsComplete = false,
            CreatedAt = DateTime.UtcNow
        };

        await _taskRepository.CreateAsync(task);

        if (task.LocationReminderEnabled && !string.IsNullOrWhiteSpace(task.PlaceId))
        {
            await ClearRecentReminderAsync(userId, task.PlaceId);
        }

        return task;
    }
    public async Task<TaskItem> UpdateTaskAsync(string userId, string taskId, UpdateTaskRequest request)
    {
        var existingTask = await _taskRepository.GetByIdAsync(taskId);
        if (existingTask == null || existingTask.UserId != userId)
        {
            return null; // Or throw an exception if you prefer
        }

        var originalPlaceId = existingTask.PlaceId;
        var originalLocationReminderEnabled = existingTask.LocationReminderEnabled;
        var wasComplete = existingTask.IsComplete;

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

            if (!request.IsComplete.Value && !string.IsNullOrWhiteSpace(existingTask.PlaceId))
            {
                await _cacheService.RemoveAsync(
                    LocationReminderService.GetRecentReminderKey(userId, existingTask.PlaceId)
                );
            }
        }
        if (request.Priority != null)
        {
            existingTask.Priority = request.Priority;
        }
        if (request.Category != null)
        {
            existingTask.Category = request.Category;
        }
        if (request.PlaceId != null || request.LocationReminderEnabled.HasValue)
        {
            existingTask.PlaceId = request.LocationReminderEnabled == true ? request.PlaceId : null;
            existingTask.LocationReminderEnabled =
                request.LocationReminderEnabled == true && !string.IsNullOrWhiteSpace(request.PlaceId);
        }
        if (request.DueDate.HasValue)
        {
            existingTask.DueDate = request.DueDate;
        }

        existingTask.UpdatedAt = DateTime.UtcNow;

        await _taskRepository.UpdateAsync(existingTask);

        var locationLinkActivated =
            existingTask.LocationReminderEnabled &&
            !string.IsNullOrWhiteSpace(existingTask.PlaceId) &&
            (
                !originalLocationReminderEnabled ||
                string.IsNullOrWhiteSpace(originalPlaceId) ||
                !string.Equals(originalPlaceId, existingTask.PlaceId, StringComparison.Ordinal) ||
                (wasComplete && !existingTask.IsComplete)
            );

        if (locationLinkActivated)
        {
            await ClearRecentReminderAsync(userId, existingTask.PlaceId);
        }

        return existingTask;
    }

    public async Task ClearPlaceReferencesAsync(string userId, string placeId)
    {
        await _taskRepository.ClearPlaceReferencesAsync(userId, placeId);
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

    private Task ClearRecentReminderAsync(string userId, string? placeId)
    {
        if (string.IsNullOrWhiteSpace(placeId))
        {
            return Task.CompletedTask;
        }

        return _cacheService.RemoveAsync(LocationReminderService.GetRecentReminderKey(userId, placeId));
    }
}
