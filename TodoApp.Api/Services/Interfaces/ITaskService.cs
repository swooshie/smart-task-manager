using TodoApp.Api.Models;
using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services.Interfaces;

public interface ITaskService
{
    Task<List<TaskItem>> GetTasksByUserIdAsync(string userId);
    Task<TaskItem> CreateTaskAsync(string userId, CreateTaskRequest request);
    Task<TaskItem> UpdateTaskAsync(string userId, string taskId, UpdateTaskRequest request);
    Task ClearPlaceReferencesAsync(string userId, string placeId);
    Task<bool> DeleteTaskAsync(string userId, string taskId);
}
