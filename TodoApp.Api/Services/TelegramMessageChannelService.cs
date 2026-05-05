using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class TelegramMessageChannelService : IMessageChannelService
{
    private readonly ITelegramBotService _telegramBotService;

    public TelegramMessageChannelService(ITelegramBotService telegramBotService)
    {
        _telegramBotService = telegramBotService;
    }

    public string ChannelName => "telegram";

    public Task<MessageSendResult> SendTextMessageAsync(
        string recipientId,
        string messageText,
        CancellationToken cancellationToken = default
    )
    {
        return _telegramBotService.SendTextMessageAsync(recipientId, messageText, cancellationToken);
    }
}
