using TodoApp.Api.DTOs;
using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class LinqInboundMessageService : ILinqInboundMessageService
{
    private readonly ITaskRepository _taskRepository;
    private readonly ICacheService _cacheService;

    public LinqInboundMessageService(ITaskRepository taskRepository, ICacheService cacheService)
    {
        _taskRepository = taskRepository;
        _cacheService = cacheService;
    }

    public async Task<string?> HandleAsync(UserPhoneLink phoneLink, string messageText)
    {
        var command = messageText.Trim();
        if (string.IsNullOrWhiteSpace(command))
        {
            return null;
        }

        if (string.Equals(command, "HELP", StringComparison.OrdinalIgnoreCase))
        {
            return BuildHelpResponse();
        }

        if (string.Equals(command, "LIST", StringComparison.OrdinalIgnoreCase))
        {
            return await BuildTaskListResponseAsync(phoneLink.UserId);
        }

        if (string.Equals(command, "DONE", StringComparison.OrdinalIgnoreCase))
        {
            return await HandleActiveReminderCompletionAsync(phoneLink.UserId);
        }

        if (command.StartsWith("ADD ", StringComparison.OrdinalIgnoreCase))
        {
            return await HandleAddAsync(phoneLink.UserId, command[4..].Trim());
        }

        if (command.StartsWith("DONE ", StringComparison.OrdinalIgnoreCase))
        {
            return await HandleCompleteAsync(phoneLink.UserId, command[5..].Trim());
        }

        if (command.StartsWith("DELETE ", StringComparison.OrdinalIgnoreCase))
        {
            return await HandleDeleteAsync(phoneLink.UserId, command[7..].Trim());
        }

        if (command.StartsWith("SNOOZE", StringComparison.OrdinalIgnoreCase))
        {
            return await HandleSnoozeAsync(phoneLink.UserId, command);
        }

        return BuildHelpResponse();
    }

    private async Task<string> BuildTaskListResponseAsync(string userId)
    {
        var tasks = await GetOpenTasksAsync(userId);

        if (tasks.Count == 0)
        {
            return "You have no open tasks. Reply ADD <task> to create one.";
        }

        var lines = tasks
            .Take(5)
            .Select((task, index) => $"{index + 1}. {task.Title}")
            .ToList();

        return $"Open tasks:\n{string.Join("\n", lines)}\nReply DONE 1, DELETE 1, or ADD <task>.";
    }

    private async Task<string> HandleAddAsync(string userId, string title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return "Send ADD followed by a task title. Example: ADD buy milk";
        }

        var task = new TaskItem
        {
            UserId = userId,
            Title = title,
            Priority = "medium",
            IsComplete = false,
            CreatedAt = DateTime.UtcNow
        };

        await _taskRepository.CreateAsync(task);
        return $"Added: {task.Title}";
    }

    private async Task<string> HandleCompleteAsync(string userId, string indexText)
    {
        if (string.Equals(indexText.Trim(), "ALL", StringComparison.OrdinalIgnoreCase))
        {
            return await HandleActiveReminderCompleteAllAsync(userId);
        }

        var task = await ResolveOpenTaskByIndexAsync(userId, indexText);
        if (task == null)
        {
            return await HandleActiveReminderIndexedCompletionAsync(userId, indexText);
        }

        task.IsComplete = true;
        task.UpdatedAt = DateTime.UtcNow;
        await _taskRepository.UpdateAsync(task);

        return $"Completed: {task.Title}";
    }

    private async Task<string> HandleDeleteAsync(string userId, string indexText)
    {
        var task = await ResolveOpenTaskByIndexAsync(userId, indexText);
        if (task == null)
        {
            return "I couldn't find that task number. Reply LIST to see your open tasks.";
        }

        await _taskRepository.DeleteAsync(task.Id);
        return $"Deleted: {task.Title}";
    }

    private async Task<string> HandleActiveReminderCompletionAsync(string userId)
    {
        var reminder = await _cacheService.GetAsync<ActiveReminderContext>(LocationReminderService.GetActiveReminderKey(userId));
        if (reminder == null || reminder.Tasks.Count == 0)
        {
            return "No active reminder is waiting. Reply LIST to see your open tasks.";
        }

        if (reminder.Tasks.Count > 1)
        {
            return BuildActiveReminderOptions(reminder);
        }

        var task = await _taskRepository.GetByIdAsync(reminder.Tasks[0].TaskId);
        if (task == null || task.UserId != userId || task.IsComplete)
        {
            return "That reminder is no longer active. Reply LIST to see your current tasks.";
        }

        task.IsComplete = true;
        task.UpdatedAt = DateTime.UtcNow;
        await _taskRepository.UpdateAsync(task);
        await _cacheService.RemoveAsync(LocationReminderService.GetActiveReminderKey(userId));
        await ClearRecentReminderAsync(userId, reminder.PlaceId);

        return $"Completed: {task.Title}";
    }

    private async Task<string> HandleActiveReminderIndexedCompletionAsync(string userId, string indexText)
    {
        var reminder = await _cacheService.GetAsync<ActiveReminderContext>(LocationReminderService.GetActiveReminderKey(userId));
        if (reminder == null || reminder.Tasks.Count == 0)
        {
            return "I couldn't find that task number. Reply LIST to see your open tasks.";
        }

        if (!int.TryParse(indexText.Trim(), out var oneBasedIndex) || oneBasedIndex < 1)
        {
            return "I couldn't find that task number. Reply LIST to see your open tasks.";
        }

        var reminderTask = reminder.Tasks.ElementAtOrDefault(oneBasedIndex - 1);
        if (reminderTask == null)
        {
            return "I couldn't find that task number. Reply LIST to see your open tasks.";
        }

        var task = await _taskRepository.GetByIdAsync(reminderTask.TaskId);
        if (task == null || task.UserId != userId || task.IsComplete)
        {
            return "That reminder item is no longer active. Reply LIST to see your current tasks.";
        }

        task.IsComplete = true;
        task.UpdatedAt = DateTime.UtcNow;
        await _taskRepository.UpdateAsync(task);

        reminder.Tasks = reminder.Tasks.Where(item => item.TaskId != reminderTask.TaskId).ToList();
        if (reminder.Tasks.Count == 0)
        {
            await _cacheService.RemoveAsync(LocationReminderService.GetActiveReminderKey(userId));
            await ClearRecentReminderAsync(userId, reminder.PlaceId);
            return $"Completed: {task.Title}";
        }

        await _cacheService.SetAsync(
            LocationReminderService.GetActiveReminderKey(userId),
            reminder,
            TimeSpan.FromHours(2)
        );

        return $"Completed: {task.Title}\n{BuildActiveReminderOptions(reminder)}";
    }

    private async Task<string> HandleActiveReminderCompleteAllAsync(string userId)
    {
        var reminder = await _cacheService.GetAsync<ActiveReminderContext>(LocationReminderService.GetActiveReminderKey(userId));
        if (reminder == null || reminder.Tasks.Count == 0)
        {
            return "No active reminder is waiting. Reply LIST to see your open tasks.";
        }

        var completedTitles = new List<string>();

        foreach (var reminderTask in reminder.Tasks)
        {
            var task = await _taskRepository.GetByIdAsync(reminderTask.TaskId);
            if (task == null || task.UserId != userId || task.IsComplete)
            {
                continue;
            }

            task.IsComplete = true;
            task.UpdatedAt = DateTime.UtcNow;
            await _taskRepository.UpdateAsync(task);
            completedTitles.Add(task.Title);
        }

        await _cacheService.RemoveAsync(LocationReminderService.GetActiveReminderKey(userId));
        await ClearRecentReminderAsync(userId, reminder.PlaceId);

        if (completedTitles.Count == 0)
        {
            return "Those reminder items are no longer active. Reply LIST to see your current tasks.";
        }

        return $"Completed all:\n{string.Join("\n", completedTitles.Select(title => $"- {title}"))}";
    }

    private async Task<string> HandleSnoozeAsync(string userId, string command)
    {
        var reminder = await _cacheService.GetAsync<ActiveReminderContext>(LocationReminderService.GetActiveReminderKey(userId));
        if (reminder == null || reminder.Tasks.Count == 0)
        {
            return "No active reminder is waiting. Reply LIST to see your open tasks.";
        }

        var minutes = 30;
        var parts = command.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length > 1 && int.TryParse(parts[1], out var parsedMinutes) && parsedMinutes > 0)
        {
            minutes = parsedMinutes;
        }

        foreach (var reminderTask in reminder.Tasks)
        {
            await _cacheService.SetAsync(
                $"linq:snooze:{userId}:{reminderTask.TaskId}",
                "snoozed",
                TimeSpan.FromMinutes(minutes)
            );
        }
        await _cacheService.RemoveAsync(LocationReminderService.GetActiveReminderKey(userId));

        return reminder.Tasks.Count == 1
            ? $"Snoozed \"{reminder.Tasks[0].TaskTitle}\" for {minutes} minutes."
            : $"Snoozed {reminder.Tasks.Count} tasks for {minutes} minutes.";
    }

    private async Task<TaskItem?> ResolveOpenTaskByIndexAsync(string userId, string indexText)
    {
        if (!int.TryParse(indexText.Trim(), out var oneBasedIndex) || oneBasedIndex < 1)
        {
            return null;
        }

        var tasks = await GetOpenTasksAsync(userId);
        return tasks.ElementAtOrDefault(oneBasedIndex - 1);
    }

    private async Task<List<TaskItem>> GetOpenTasksAsync(string userId)
    {
        var tasks = await _taskRepository.GetByUserIdAsync(userId);
        return tasks
            .Where(task => !task.IsComplete)
            .OrderByDescending(task => task.CreatedAt)
            .ToList();
    }

    private static string BuildHelpResponse()
    {
        return "Commands: LIST, ADD <task>, DONE <serial number>, DONE ALL, DELETE <number>, DONE, SNOOZE 30, HELP.";
    }

    private Task ClearRecentReminderAsync(string userId, string placeId)
    {
        if (string.IsNullOrWhiteSpace(placeId))
        {
            return Task.CompletedTask;
        }

        return _cacheService.RemoveAsync(LocationReminderService.GetRecentReminderKey(userId, placeId));
    }

    private static string BuildActiveReminderOptions(ActiveReminderContext reminder)
    {
        var lines = reminder.Tasks
            .Select((task, index) => $"{index + 1}. {task.TaskTitle}")
            .ToList();

        return
            $"Open at {reminder.PlaceName}:\n" +
            $"{string.Join("\n", lines)}\n" +
            "Reply DONE <serial number>, DONE ALL, SNOOZE 30, or LIST.";
    }
}
