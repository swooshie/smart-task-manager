using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services.Interfaces;

public interface ILocationReminderService
{
    Task<LocationReminderResult> ProcessLocationEventAsync(string userId, ReportLocationEventRequest request);
}
