using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services.Interfaces;

public interface ISavedPlaceService
{
    Task<List<SavedPlaceResponse>> GetByUserIdAsync(string userId);
    Task<SavedPlaceResponse> CreateAsync(string userId, CreateSavedPlaceRequest request);
    Task<SavedPlaceResponse?> UpdateAsync(string userId, string placeId, UpdateSavedPlaceRequest request);
    Task DeleteAsync(string userId, string placeId);
}
