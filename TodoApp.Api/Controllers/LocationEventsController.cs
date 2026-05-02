using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApp.Api.DTOs;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Controllers;

[ApiController]
[Route("api/location-events")]
[Authorize]
public class LocationEventsController : ControllerBase
{
    private readonly ILocationReminderService _locationReminderService;

    public LocationEventsController(ILocationReminderService locationReminderService)
    {
        _locationReminderService = locationReminderService;
    }

    [HttpPost("simulate")]
    public async Task<IActionResult> Simulate([FromBody] SimulateLocationEventRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        var result = await _locationReminderService.ProcessLocationEventAsync(userId, request);
        return Ok(result);
    }
}
