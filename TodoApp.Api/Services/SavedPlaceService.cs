using TodoApp.Api.DTOs;
using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class SavedPlaceService : ISavedPlaceService
{
    private readonly ISavedPlaceRepository _savedPlaceRepository;
    private readonly ITaskService _taskService;

    public SavedPlaceService(ISavedPlaceRepository savedPlaceRepository, ITaskService taskService)
    {
        _savedPlaceRepository = savedPlaceRepository;
        _taskService = taskService;
    }

    public async Task<List<SavedPlaceResponse>> GetByUserIdAsync(string userId)
    {
        var places = await _savedPlaceRepository.GetByUserIdAsync(userId);
        return places.Select(Map).ToList();
    }

    public async Task<SavedPlaceResponse> CreateAsync(string userId, CreateSavedPlaceRequest request)
    {
        var place = new SavedPlace
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            RadiusMeters = request.RadiusMeters
        };

        await _savedPlaceRepository.CreateAsync(place);
        return Map(place);
    }

    public async Task<SavedPlaceResponse?> UpdateAsync(string userId, string placeId, UpdateSavedPlaceRequest request)
    {
        var existing = await _savedPlaceRepository.GetByIdAsync(userId, placeId);
        if (existing == null)
        {
            return null;
        }

        existing.Name = request.Name.Trim();
        existing.Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim();
        existing.Latitude = request.Latitude;
        existing.Longitude = request.Longitude;
        existing.RadiusMeters = request.RadiusMeters;

        await _savedPlaceRepository.UpdateAsync(existing);
        return Map(existing);
    }

    public async Task DeleteAsync(string userId, string placeId)
    {
        await _savedPlaceRepository.DeleteAsync(userId, placeId);
        await _taskService.ClearPlaceReferencesAsync(userId, placeId);
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
