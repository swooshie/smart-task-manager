using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApp.Api.DTOs;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Controllers;

[ApiController]
[Route("api/places")]
[Authorize]
public class PlacesController : ControllerBase
{
    private readonly ISavedPlaceService _savedPlaceService;

    public PlacesController(ISavedPlaceService savedPlaceService)
    {
        _savedPlaceService = savedPlaceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPlaces()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        var places = await _savedPlaceService.GetByUserIdAsync(userId);
        return Ok(places);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePlace([FromBody] CreateSavedPlaceRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        try
        {
            var place = await _savedPlaceService.CreateAsync(userId, request);
            return Ok(place);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlace(string id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        await _savedPlaceService.DeleteAsync(userId, id);
        return Ok(new { message = "Place deleted successfully." });
    }
}
