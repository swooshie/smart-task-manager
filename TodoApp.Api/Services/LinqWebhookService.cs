using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TodoApp.Api.Configuration;
using TodoApp.Api.DTOs;
using TodoApp.Api.Repositories.Interfaces;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class LinqWebhookService : ILinqWebhookService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IUserPhoneLinkRepository _userPhoneLinkRepository;
    private readonly ILinqInboundMessageService _linqInboundMessageService;
    private readonly ILinqClientService _linqClientService;
    private readonly LinqSettings _linqSettings;
    private readonly ILogger<LinqWebhookService> _logger;

    public LinqWebhookService(
        IUserPhoneLinkRepository userPhoneLinkRepository,
        ILinqInboundMessageService linqInboundMessageService,
        ILinqClientService linqClientService,
        IOptions<LinqSettings> linqSettings,
        ILogger<LinqWebhookService> logger)
    {
        _userPhoneLinkRepository = userPhoneLinkRepository;
        _linqInboundMessageService = linqInboundMessageService;
        _linqClientService = linqClientService;
        _linqSettings = linqSettings.Value;
        _logger = logger;
    }

    public bool IsSignatureValid(string rawBody, string? timestamp, string? signature)
    {
        if (string.IsNullOrWhiteSpace(_linqSettings.WebhookSecret))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(timestamp) || string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        var payload = $"{timestamp}.{rawBody}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_linqSettings.WebhookSecret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var expectedSignature = Convert.ToHexString(hash).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expectedSignature),
            Encoding.UTF8.GetBytes(signature.ToLowerInvariant())
        );
    }

    public async Task ProcessAsync(LinqWebhookEnvelope webhookEvent)
    {
        if (!string.Equals(webhookEvent.EventType, "message.received", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var chatId = webhookEvent.Data?.Chat?.Id ?? webhookEvent.Data?.ChatId;
        var senderPhoneNumber = webhookEvent.Data?.SenderHandle?.Handle ?? webhookEvent.Data?.From;
        var text = ExtractText(webhookEvent);

        if (string.IsNullOrWhiteSpace(chatId) || string.IsNullOrWhiteSpace(senderPhoneNumber))
        {
            return;
        }

        var normalizedPhoneNumber = NormalizePhoneNumber(senderPhoneNumber);
        var phoneLink = await _userPhoneLinkRepository.GetByPhoneNumberAsync(normalizedPhoneNumber);

        if (phoneLink == null)
        {
            await TrySendReplyAsync(
                chatId,
                "I couldn't match this number to an account yet. Link your phone in the app, then text HELP."
            );
            return;
        }

        phoneLink.LinqChatId = chatId;
        phoneLink.HasInitiatedConversation = true;
        phoneLink.FirstInboundMessageAt ??= DateTime.UtcNow;
        phoneLink.LastInboundMessageAt = DateTime.UtcNow;
        await _userPhoneLinkRepository.UpsertAsync(phoneLink);

        if (string.IsNullOrWhiteSpace(text))
        {
            return;
        }

        var reply = await _linqInboundMessageService.HandleAsync(phoneLink, text);
        if (string.IsNullOrWhiteSpace(reply))
        {
            return;
        }

        var sent = await TrySendReplyAsync(chatId, reply);
        if (sent)
        {
            phoneLink.LastOutboundMessageAt = DateTime.UtcNow;
            await _userPhoneLinkRepository.UpsertAsync(phoneLink);
        }
    }

    public static LinqWebhookEnvelope? Deserialize(string rawBody)
    {
        return JsonSerializer.Deserialize<LinqWebhookEnvelope>(rawBody, JsonOptions);
    }

    private static string ExtractText(LinqWebhookEnvelope webhookEvent)
    {
        var parts = webhookEvent.Data?.Parts ?? webhookEvent.Data?.Message?.Parts;
        if (parts == null || parts.Count == 0)
        {
            return string.Empty;
        }

        return string.Join(
            " ",
            parts
                .Where(part => string.Equals(part.Type, "text", StringComparison.OrdinalIgnoreCase))
                .Select(part => part.Value)
                .Where(value => !string.IsNullOrWhiteSpace(value))
        ).Trim();
    }

    private static string NormalizePhoneNumber(string input)
    {
        var trimmed = input.Trim();
        if (trimmed.StartsWith('+'))
        {
            return $"+{new string(trimmed.Where(char.IsDigit).ToArray())}";
        }

        return $"+{new string(trimmed.Where(char.IsDigit).ToArray())}";
    }

    private async Task<bool> TrySendReplyAsync(string chatId, string message)
    {
        try
        {
            var result = await _linqClientService.SendTextMessageAsync(chatId, message);
            if (result == null)
            {
                _logger.LogWarning("Linq reply send failed with empty response for chat {ChatId}", chatId);
                return false;
            }

            return result != null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Linq reply send failed for chat {ChatId}", chatId);
            return false;
        }
    }
}
