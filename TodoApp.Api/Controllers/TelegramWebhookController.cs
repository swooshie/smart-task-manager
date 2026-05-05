using Microsoft.AspNetCore.Mvc;
using TodoApp.Api.DTOs;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Controllers;

[ApiController]
[Route("api/telegram/webhook")]
public class TelegramWebhookController : ControllerBase
{
    private readonly ITelegramWebhookService _telegramWebhookService;

    public TelegramWebhookController(ITelegramWebhookService telegramWebhookService)
    {
        _telegramWebhookService = telegramWebhookService;
    }

    [HttpPost]
    public async Task<IActionResult> Receive([FromBody] TelegramWebhookUpdate update)
    {
        var secret = Request.Headers["X-Telegram-Bot-Api-Secret-Token"].FirstOrDefault();
        if (!_telegramWebhookService.IsSecretValid(secret))
        {
            return Unauthorized(new { message = "Invalid Telegram webhook secret." });
        }

        await _telegramWebhookService.ProcessAsync(update);
        return Ok(new { received = true });
    }
}
