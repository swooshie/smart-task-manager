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
    private readonly IMessageDispatchService _messageDispatchService;
    private readonly ICacheService _cacheService;

    public LocationReminderService(
        ISavedPlaceRepository savedPlaceRepository,
        ITaskRepository taskRepository,
        IUserPhoneLinkRepository userPhoneLinkRepository,
        IMessageDispatchService messageDispatchService,
        ICacheService cacheService)
    {
        _savedPlaceRepository = savedPlaceRepository;
        _taskRepository = taskRepository;
        _userPhoneLinkRepository = userPhoneLinkRepository;
        _messageDispatchService = messageDispatchService;
        _cacheService = cacheService;
    }

    public async Task<LocationReminderResult> ProcessLocationEventAsync(string userId, ReportLocationEventRequest request)
    {
        var phoneLink = await _userPhoneLinkRepository.GetByUserIdAsync(userId);
        if (phoneLink == null || !phoneLink.HasInitiatedConversation || !_messageDispatchService.CanSend(phoneLink))
        {
            return new LocationReminderResult
            {
                ReminderSent = false,
                Message = "Link your messaging channel and send it a first message before reminders can be sent."
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
        var candidateTasks = PickTasks(tasks, nearbyPlace, snoozedTaskIds);

        if (candidateTasks.Count == 0)
        {
            return new LocationReminderResult
            {
                ReminderSent = false,
                PlaceName = nearbyPlace.Name,
                Message = "You are near a saved place, but no open task is linked to it."
            };
        }

        var dedupeKey = GetRecentReminderKey(userId, nearbyPlace.Id);
        var existing = await _cacheService.GetAsync<string>(dedupeKey);
        if (!string.IsNullOrWhiteSpace(existing))
        {
            return new LocationReminderResult
            {
                ReminderSent = false,
                PlaceName = nearbyPlace.Name,
                TaskTitle = candidateTasks[0].Title,
                Message = "A reminder for this place and task was sent recently."
            };
        }

        var reminderText = BuildReminderText(nearbyPlace.Name, candidateTasks);

        var sendResult = await _messageDispatchService.SendTextMessageAsync(phoneLink, reminderText);
        if (!sendResult.Success)
        {
            return new LocationReminderResult
            {
                ReminderSent = false,
                PlaceName = nearbyPlace.Name,
                TaskTitle = candidateTasks[0].Title,
                Message = sendResult.UserMessage ?? $"{_messageDispatchService.ResolveChannelName(phoneLink)} is currently unavailable."
            };
        }

        phoneLink.LastOutboundMessageAt = DateTime.UtcNow;
        await _userPhoneLinkRepository.UpsertAsync(phoneLink);

        await _cacheService.SetAsync(dedupeKey, "sent", TimeSpan.FromMinutes(30));
        await _cacheService.SetAsync(
            GetActiveReminderKey(userId),
            new ActiveReminderContext
            {
                Tasks = candidateTasks
                    .Select(task => new ActiveReminderTask
                    {
                        TaskId = task.Id,
                        TaskTitle = task.Title
                    })
                    .ToList(),
                PlaceId = nearbyPlace.Id,
                PlaceName = nearbyPlace.Name,
                CreatedAt = DateTime.UtcNow
            },
            TimeSpan.FromHours(2)
        );

        return new LocationReminderResult
        {
            ReminderSent = true,
            PlaceName = nearbyPlace.Name,
            TaskTitle = candidateTasks[0].Title,
            Message = reminderText
        };
    }

    public static string GetActiveReminderKey(string userId) => $"linq:active-reminder:{userId}";
    public static string GetRecentReminderKey(string userId, string placeId) => $"linq:location-reminder:{userId}:{placeId}";

    private async Task<SavedPlace?> FindNearbyPlaceAsync(string userId, ReportLocationEventRequest request)
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

    private static List<TaskItem> PickTasks(IEnumerable<TaskItem> tasks, SavedPlace place, HashSet<string> snoozedTaskIds)
    {
        return tasks
            .Where(task =>
                !task.IsComplete &&
                !snoozedTaskIds.Contains(task.Id) &&
                task.LocationReminderEnabled &&
                task.PlaceId == place.Id)
            .OrderByDescending(task => task.CreatedAt)
            .ToList();
    }

    private static string BuildReminderText(string placeName, IReadOnlyList<TaskItem> tasks)
    {
        if (tasks.Count == 1)
        {
            return $"You're near {placeName} and still have \"{tasks[0].Title}\" open. Reply DONE, SNOOZE 30, or LIST.";
        }

        var lines = tasks
            .Select((task, index) => $"{index + 1}. {task.Title}")
            .ToList();

        return
            $"You're near {placeName}. These tasks are still open:\n" +
            $"{string.Join("\n", lines)}\n" +
            "Reply DONE <number>, DONE ALL, SNOOZE 30, or LIST.";
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
