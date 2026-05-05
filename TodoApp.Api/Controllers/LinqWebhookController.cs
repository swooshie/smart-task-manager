using System.Text;
using Microsoft.AspNetCore.Mvc;
using TodoApp.Api.Services;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Controllers;

[ApiController]
[Route("api/linq/webhook")]
public class LinqWebhookController : ControllerBase
{
    private readonly ILinqWebhookService _linqWebhookService;

    public LinqWebhookController(ILinqWebhookService linqWebhookService)
    {
        _linqWebhookService = linqWebhookService;
    }

    [HttpPost]
    public async Task<IActionResult> Receive()
    {
        Request.EnableBuffering();

        string rawBody;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
        {
            rawBody = await reader.ReadToEndAsync();
            Request.Body.Position = 0;
        }

        var timestamp = Request.Headers["X-Webhook-Timestamp"].FirstOrDefault();
        var signature = Request.Headers["X-Webhook-Signature"].FirstOrDefault();

        if (!_linqWebhookService.IsSignatureValid(rawBody, timestamp, signature))
        {
            return Unauthorized(new { message = "Invalid webhook signature." });
        }

        var webhookEvent = LinqWebhookService.Deserialize(rawBody);
        if (webhookEvent == null)
        {
            return BadRequest(new { message = "Invalid webhook payload." });
        }

        await _linqWebhookService.ProcessAsync(webhookEvent);
        return Ok(new { received = true });
    }
}
