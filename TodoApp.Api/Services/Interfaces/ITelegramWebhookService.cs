using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services.Interfaces;

public interface ITelegramWebhookService
{
    bool IsSecretValid(string? secret);
    Task ProcessAsync(TelegramWebhookUpdate update);
}
