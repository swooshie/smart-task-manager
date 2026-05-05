using TodoApp.Api.Models;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class MessageDispatchService : IMessageDispatchService
{
    private readonly LinqMessageChannelService _linqMessageChannelService;
    private readonly TelegramMessageChannelService _telegramMessageChannelService;

    public MessageDispatchService(
        LinqMessageChannelService linqMessageChannelService,
        TelegramMessageChannelService telegramMessageChannelService)
    {
        _linqMessageChannelService = linqMessageChannelService;
        _telegramMessageChannelService = telegramMessageChannelService;
    }

    public string ResolveChannelName(UserPhoneLink link)
    {
        return string.Equals(link.PreferredChannel, MessagingChannel.Telegram, StringComparison.OrdinalIgnoreCase)
            ? _telegramMessageChannelService.ChannelName
            : _linqMessageChannelService.ChannelName;
    }

    public bool CanSend(UserPhoneLink link)
    {
        return !string.IsNullOrWhiteSpace(GetRecipientId(link));
    }

    public Task<MessageSendResult> SendTextMessageAsync(
        UserPhoneLink link,
        string messageText,
        CancellationToken cancellationToken = default)
    {
        var recipientId = GetRecipientId(link);
        if (string.IsNullOrWhiteSpace(recipientId))
        {
            var channel = string.Equals(link.PreferredChannel, MessagingChannel.Telegram, StringComparison.OrdinalIgnoreCase)
                ? "telegram"
                : "linq";
            var userMessage = channel == "telegram"
                ? "Telegram is not fully linked yet. Open the bot and send HELP first."
                : "Text messaging is not fully linked yet. Send a first text to connect it.";

            return Task.FromResult(
                MessageSendResult.Fail(channel, userMessage, errorCode: "recipient_missing")
            );
        }

        return string.Equals(link.PreferredChannel, MessagingChannel.Telegram, StringComparison.OrdinalIgnoreCase)
            ? _telegramMessageChannelService.SendTextMessageAsync(recipientId, messageText, cancellationToken)
            : _linqMessageChannelService.SendTextMessageAsync(recipientId, messageText, cancellationToken);
    }

    private static string? GetRecipientId(UserPhoneLink link)
    {
        if (string.Equals(link.PreferredChannel, MessagingChannel.Telegram, StringComparison.OrdinalIgnoreCase))
        {
            return link.TelegramChatId;
        }

        return link.LinqChatId;
    }
}
