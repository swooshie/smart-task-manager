using MongoDB.Driver;
using TodoApp.Api.Data;
using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;

namespace TodoApp.Api.Repositories;

public class SavedPlaceRepository : ISavedPlaceRepository
{
    private readonly MongoDbContext _context;

    public SavedPlaceRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<List<SavedPlace>> GetByUserIdAsync(string userId)
    {
        return await _context.SavedPlaces
            .Find(place => place.UserId == userId)
            .SortByDescending(place => place.CreatedAt)
            .ToListAsync();
    }

    public async Task CreateAsync(SavedPlace place)
    {
        await _context.SavedPlaces.InsertOneAsync(place);
    }

    public async Task DeleteAsync(string userId, string placeId)
    {
        await _context.SavedPlaces.DeleteOneAsync(place => place.UserId == userId && place.Id == placeId);
    }
}
