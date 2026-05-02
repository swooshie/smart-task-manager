using TodoApp.Api.DTOs;
using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class LocationReminderService : ILocationReminderService
{
    private readonly ISavedPlaceRepository _savedPlaceRepository;
    private readonly ITaskRepository _taskRepository;
    private readonly IUserPhoneLinkRepository _userPhoneLinkRepository;
    private readonly ILinqClientService _linqClientService;
    private readonly ICacheService _cacheService;

    public LocationReminderService(
        ISavedPlaceRepository savedPlaceRepository,
        ITaskRepository taskRepository,
        IUserPhoneLinkRepository userPhoneLinkRepository,
        ILinqClientService linqClientService,
        ICacheService cacheService)
    {
        _savedPlaceRepository = savedPlaceRepository;
        _taskRepository = taskRepository;
        _userPhoneLinkRepository = userPhoneLinkRepository;
        _linqClientService = linqClientService;
        _cacheService = cacheService;
    }

    public async Task<LocationReminderResult> ProcessLocationEventAsync(string userId, SimulateLocationEventRequest request)
    {
        var phoneLink = await _userPhoneLinkRepository.GetByUserIdAsync(userId);
        if (phoneLink == null || !phoneLink.HasInitiatedConversation || string.IsNullOrWhiteSpace(phoneLink.LinqChatId))
        {
            return new LocationReminderResult
            {
                ReminderSent = false,
                Message = "Link a phone number and send the sandbox number a first message before reminders can be sent."
            };
        }

        var nearbyPlace = await FindNearbyPlaceAsync(userId, request);
        if (nearbyPlace == null)
        {
            return new LocationReminderResult
            {
                ReminderSent = false,
                Message = "No saved place matched this location."
            };
        }

        var tasks = await _taskRepository.GetByUserIdAsync(userId);
        var snoozedTaskIds = await GetSnoozedTaskIdsAsync(userId, tasks);
        var candidateTask = PickBestTask(tasks, nearbyPlace, snoozedTaskIds);

        if (candidateTask == null)
        {
            return new LocationReminderResult
            {
                ReminderSent = false,
                PlaceName = nearbyPlace.Name,
                Message = "You are near a saved place, but no open task strongly matches it."
            };
        }

        var dedupeKey = $"linq:location-reminder:{userId}:{nearbyPlace.Id}:{candidateTask.Id}";
        var existing = await _cacheService.GetAsync<string>(dedupeKey);
        if (!string.IsNullOrWhiteSpace(existing))
        {
            return new LocationReminderResult
            {
                ReminderSent = false,
                PlaceName = nearbyPlace.Name,
                TaskTitle = candidateTask.Title,
                Message = "A reminder for this place and task was sent recently."
            };
        }

        var reminderText =
            $"You're near {nearbyPlace.Name} and still have \"{candidateTask.Title}\" open. " +
            "Reply DONE, SNOOZE 30, or LIST.";

        var result = await _linqClientService.SendTextMessageAsync(phoneLink.LinqChatId, reminderText);
        if (result == null)
        {
            return new LocationReminderResult
            {
                ReminderSent = false,
                PlaceName = nearbyPlace.Name,
                TaskTitle = candidateTask.Title,
                Message = "Linq message send failed."
            };
        }

        phoneLink.LastOutboundMessageAt = DateTime.UtcNow;
        await _userPhoneLinkRepository.UpsertAsync(phoneLink);

        await _cacheService.SetAsync(dedupeKey, "sent", TimeSpan.FromMinutes(30));
        await _cacheService.SetAsync(
            GetActiveReminderKey(userId),
            new ActiveReminderContext
            {
                TaskId = candidateTask.Id,
                TaskTitle = candidateTask.Title,
                PlaceName = nearbyPlace.Name,
                CreatedAt = DateTime.UtcNow
            },
            TimeSpan.FromHours(2)
        );

        return new LocationReminderResult
        {
            ReminderSent = true,
            PlaceName = nearbyPlace.Name,
            TaskTitle = candidateTask.Title,
            Message = reminderText
        };
    }

    public static string GetActiveReminderKey(string userId) => $"linq:active-reminder:{userId}";

    private async Task<SavedPlace?> FindNearbyPlaceAsync(string userId, SimulateLocationEventRequest request)
    {
        var places = await _savedPlaceRepository.GetByUserIdAsync(userId);

        return places
            .Select(place => new
            {
                Place = place,
                DistanceMeters = CalculateDistanceMeters(
                    request.Latitude,
                    request.Longitude,
                    place.Latitude,
                    place.Longitude)
            })
            .Where(item => item.DistanceMeters <= item.Place.RadiusMeters)
            .OrderBy(item => item.DistanceMeters)
            .Select(item => item.Place)
            .FirstOrDefault();
    }

    private static TaskItem? PickBestTask(IEnumerable<TaskItem> tasks, SavedPlace place, HashSet<string> snoozedTaskIds)
    {
        var category = place.Category?.Trim().ToLowerInvariant();
        var placeName = place.Name.Trim().ToLowerInvariant();

        return tasks
            .Where(task => !task.IsComplete && !snoozedTaskIds.Contains(task.Id))
            .Select(task => new
            {
                Task = task,
                Score = ScoreTask(task, category, placeName)
            })
            .Where(item => item.Score > 0)
            .OrderByDescending(item => item.Score)
            .ThenByDescending(item => item.Task.CreatedAt)
            .Select(item => item.Task)
            .FirstOrDefault();
    }

    private static int ScoreTask(TaskItem task, string? category, string placeName)
    {
        var score = 0;
        var title = task.Title.Trim().ToLowerInvariant();
        var description = task.Description?.Trim().ToLowerInvariant() ?? string.Empty;
        var taskCategory = task.Category?.Trim().ToLowerInvariant();

        if (!string.IsNullOrWhiteSpace(category) && taskCategory == category)
        {
            score += 5;
        }

        if (title.Contains(placeName, StringComparison.OrdinalIgnoreCase) ||
            description.Contains(placeName, StringComparison.OrdinalIgnoreCase))
        {
            score += 4;
        }

        if (!string.IsNullOrWhiteSpace(category) &&
            (title.Contains(category, StringComparison.OrdinalIgnoreCase) ||
             description.Contains(category, StringComparison.OrdinalIgnoreCase)))
        {
            score += 3;
        }

        return score;
    }

    private async Task<HashSet<string>> GetSnoozedTaskIdsAsync(string userId, IEnumerable<TaskItem> tasks)
    {
        var snoozed = new HashSet<string>();

        foreach (var task in tasks)
        {
            var cached = await _cacheService.GetAsync<string>($"linq:snooze:{userId}:{task.Id}");
            if (!string.IsNullOrWhiteSpace(cached))
            {
                snoozed.Add(task.Id);
            }
        }

        return snoozed;
    }

    private static double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusMeters = 6371000;
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180;
}
