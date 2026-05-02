using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services.Interfaces;

public interface ILinqWebhookService
{
    bool IsSignatureValid(string rawBody, string? timestamp, string? signature);
    Task ProcessAsync(LinqWebhookEnvelope webhookEvent);
}
