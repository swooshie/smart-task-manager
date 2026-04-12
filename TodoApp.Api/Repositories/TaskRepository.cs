using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;
using TodoApp.Api.Data;
using MongoDB.Driver;

namespace TodoApp.Api.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly MongoDbContext _context;
    public TaskRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<List<TaskItem>> GetByUserIdAsync(string userId)
    {
        return await _context.Tasks
            .Find(t => t.UserId == userId)
            .SortByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<TaskItem> GetByIdAsync(string id)
    {
        return await _context.Tasks
            .Find(t => t.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task CreateAsync(TaskItem task)
    {
        await _context.Tasks.InsertOneAsync(task);
    }

    public async Task UpdateAsync(TaskItem task)
    {
        await _context.Tasks.ReplaceOneAsync(t => t.Id == task.Id, task);
    }

    public async Task DeleteAsync(string id)
    {
        await _context.Tasks.DeleteOneAsync(t => t.Id == id);
    }
}