using TodoApp.Api.Models;

namespace TodoApp.Api.Repositories.Interfaces;

public interface ISavedPlaceRepository
{
    Task<List<SavedPlace>> GetByUserIdAsync(string userId);
    Task CreateAsync(SavedPlace place);
    Task DeleteAsync(string userId, string placeId);
}
