using TodoApp.Api.Models;

namespace TodoApp.Api.Repositories.Interfaces;

public interface ITaskRepository
{
    Task<List<TaskItem>> GetByUserIdAsync(string userId);
    Task<TaskItem> GetByIdAsync(string id);
    Task CreateAsync(TaskItem task);
    Task UpdateAsync(TaskItem task);
    Task DeleteAsync(string id);
}