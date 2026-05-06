using MongoDB.Bson;
using MongoDB.Driver;
using TodoApp.Api.Data;
using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;

namespace TodoApp.Api.Repositories;

public class UserPhoneLinkRepository : IUserPhoneLinkRepository
{
    private readonly MongoDbContext _context;

    public UserPhoneLinkRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<UserPhoneLink?> GetByUserIdAsync(string userId)
    {
        return await _context.UserPhoneLinks
            .Find(link => link.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public async Task<UserPhoneLink?> GetByPhoneNumberAsync(string phoneNumber)
    {
        return await _context.UserPhoneLinks
            .Find(link => link.PhoneNumber == phoneNumber)
            .FirstOrDefaultAsync();
    }

    public async Task<UserPhoneLink?> GetByTelegramUsernameAsync(string username)
    {
        return await _context.UserPhoneLinks
            .Find(link => link.TelegramUsername == username)
            .FirstOrDefaultAsync();
    }

    public async Task UpsertAsync(UserPhoneLink phoneLink)
    {
        if (string.IsNullOrWhiteSpace(phoneLink.Id))
        {
            phoneLink.Id = ObjectId.GenerateNewId().ToString();
        }

        phoneLink.UpdatedAt = DateTime.UtcNow;

        await _context.UserPhoneLinks.ReplaceOneAsync(
            link => link.UserId == phoneLink.UserId,
            phoneLink,
            new ReplaceOptions { IsUpsert = true }
        );
    }
}
