using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApp.Api.DTOs;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Controllers;

[ApiController]
[Route("api/phone-links")]
[Authorize]
public class PhoneLinksController : ControllerBase
{
    private readonly IUserPhoneLinkService _userPhoneLinkService;

    public PhoneLinksController(IUserPhoneLinkService userPhoneLinkService)
    {
        _userPhoneLinkService = userPhoneLinkService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyPhoneLink()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        var phoneLink = await _userPhoneLinkService.GetByUserIdAsync(userId);
        if (phoneLink == null)
        {
            return NotFound(new { message = "No phone link found for this user." });
        }

        return Ok(phoneLink);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpsertMyPhoneLink([FromBody] UpsertUserPhoneLinkRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        try
        {
            var phoneLink = await _userPhoneLinkService.UpsertAsync(userId, request);
            return Ok(phoneLink);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(503, new { message = ex.Message });
        }
    }

    [HttpGet("available-lines")]
    public async Task<IActionResult> GetAvailableLines()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        var lines = await _userPhoneLinkService.GetAvailableLinesAsync();
        return Ok(lines);
    }
}
