namespace TodoApp.Api.DTOs;

public class LocationReminderResult
{
    public bool ReminderSent { get; set; }
    public string? PlaceName { get; set; }
    public string? TaskTitle { get; set; }
    public string? Message { get; set; }
}
