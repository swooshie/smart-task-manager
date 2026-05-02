using TodoApp.Api.DTOs;
using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class SavedPlaceService : ISavedPlaceService
{
    private readonly ISavedPlaceRepository _savedPlaceRepository;

    public SavedPlaceService(ISavedPlaceRepository savedPlaceRepository)
    {
        _savedPlaceRepository = savedPlaceRepository;
    }

    public async Task<List<SavedPlaceResponse>> GetByUserIdAsync(string userId)
    {
        var places = await _savedPlaceRepository.GetByUserIdAsync(userId);
        return places.Select(Map).ToList();
    }

    public async Task<SavedPlaceResponse> CreateAsync(string userId, CreateSavedPlaceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Category))
        {
            throw new ArgumentException("A task category is required for saved places.");
        }

        var place = new SavedPlace
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Category = request.Category.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            RadiusMeters = request.RadiusMeters
        };

        await _savedPlaceRepository.CreateAsync(place);
        return Map(place);
    }

    public async Task DeleteAsync(string userId, string placeId)
    {
        await _savedPlaceRepository.DeleteAsync(userId, placeId);
    }

    private static SavedPlaceResponse Map(SavedPlace place)
    {
        return new SavedPlaceResponse
        {
            Id = place.Id,
            Name = place.Name,
            Category = place.Category,
            Latitude = place.Latitude,
            Longitude = place.Longitude,
            RadiusMeters = place.RadiusMeters
        };
    }
}
