using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;
using MongoDB.Driver;
using TodoApp.Api.Data;

namespace TodoApp.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly MongoDbContext _context;

    public UserRepository(MongoDbContext context)
    {
        _context = context;
    }
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .Find(u => u.Email == email)
            .FirstOrDefaultAsync();
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        return await _context.Users
            .Find(u => u.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task CreateAsync(User user)
    {
        await _context.Users.InsertOneAsync(user);
    }
}