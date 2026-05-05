namespace TodoApp.Api.DTOs;

public class ActiveReminderContext
{
    public List<ActiveReminderTask> Tasks { get; set; } = [];
    public string PlaceId { get; set; } = string.Empty;
    public string PlaceName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ActiveReminderTask
{
    public string TaskId { get; set; } = string.Empty;
    public string TaskTitle { get; set; } = string.Empty;
}
