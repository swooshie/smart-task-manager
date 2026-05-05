using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TodoApp.Api.Configuration;
using TodoApp.Api.DTOs;
using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class TelegramWebhookService : ITelegramWebhookService
{
    private readonly IUserPhoneLinkRepository _userPhoneLinkRepository;
    private readonly ILinqInboundMessageService _linqInboundMessageService;
    private readonly ITelegramBotService _telegramBotService;
    private readonly ILocationReminderService _locationReminderService;
    private readonly TelegramSettings _telegramSettings;
    private readonly ILogger<TelegramWebhookService> _logger;

    public TelegramWebhookService(
        IUserPhoneLinkRepository userPhoneLinkRepository,
        ILinqInboundMessageService linqInboundMessageService,
        ITelegramBotService telegramBotService,
        ILocationReminderService locationReminderService,
        IOptions<TelegramSettings> telegramSettings,
        ILogger<TelegramWebhookService> logger)
    {
        _userPhoneLinkRepository = userPhoneLinkRepository;
        _linqInboundMessageService = linqInboundMessageService;
        _telegramBotService = telegramBotService;
        _locationReminderService = locationReminderService;
        _telegramSettings = telegramSettings.Value;
        _logger = logger;
    }

    public bool IsSecretValid(string? secret)
    {
        if (string.IsNullOrWhiteSpace(_telegramSettings.WebhookSecret))
        {
            return true;
        }

        return string.Equals(secret, _telegramSettings.WebhookSecret, StringComparison.Ordinal);
    }

    public async Task ProcessAsync(TelegramWebhookUpdate update)
    {
        var message = update.Message;
        if (message?.Chat == null)
        {
            return;
        }

        var chatId = message.Chat.Id.ToString();
        var username = message.From?.Username;

        if (string.IsNullOrWhiteSpace(username))
        {
            await TrySendReplyAsync(
                chatId,
                "Please set a Telegram username in your profile, then try again."
            );
            return;
        }

        var link = await _userPhoneLinkRepository.GetByTelegramUsernameAsync(
            username.Trim().ToLowerInvariant()
        );

        if (link == null)
        {
            await TrySendReplyAsync(
                chatId,
                "I couldn't match this Telegram account yet. Link it in the app first, then send HELP."
            );
            return;
        }

        link.TelegramChatId = chatId;
        link.PreferredChannel = MessagingChannel.Telegram;
        link.HasInitiatedConversation = true;
        link.FirstInboundMessageAt ??= DateTime.UtcNow;
        link.LastInboundMessageAt = DateTime.UtcNow;
        await _userPhoneLinkRepository.UpsertAsync(link);

        if (message.Location != null)
        {
            var result = await _locationReminderService.ProcessLocationEventAsync(
                link.UserId,
                new ReportLocationEventRequest
                {
                    Latitude = message.Location.Latitude,
                    Longitude = message.Location.Longitude
                }
            );

            if (!string.IsNullOrWhiteSpace(result.Message))
            {
                await TrySendReplyAsync(chatId, result.Message);
            }

            return;
        }

        if (string.IsNullOrWhiteSpace(message.Text))
        {
            return;
        }

        var reply = await _linqInboundMessageService.HandleAsync(link, message.Text);
        if (!string.IsNullOrWhiteSpace(reply))
        {
            await TrySendReplyAsync(chatId, reply);
        }
    }

    private async Task<bool> TrySendReplyAsync(string chatId, string message)
    {
        var result = await _telegramBotService.SendTextMessageAsync(chatId, message);
        if (result.Success)
        {
            return true;
        }

        _logger.LogWarning(
            "Telegram reply send failed. Code={ErrorCode} Status={StatusCode} Detail={TechnicalMessage}",
            result.ErrorCode,
            result.StatusCode,
            result.TechnicalMessage
        );
        return false;
    }
}
