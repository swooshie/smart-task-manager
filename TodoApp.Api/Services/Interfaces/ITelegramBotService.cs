namespace TodoApp.Api.Services.Interfaces;

public interface ITelegramBotService
{
    Task<MessageSendResult> SendTextMessageAsync(
        string chatId,
        string messageText,
        CancellationToken cancellationToken = default
    );
}
