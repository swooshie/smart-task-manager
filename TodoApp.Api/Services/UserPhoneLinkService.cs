using Microsoft.Extensions.Options;
using TodoApp.Api.Configuration;
using TodoApp.Api.DTOs;
using TodoApp.Api.Models;
using TodoApp.Api.Repositories.Interfaces;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class UserPhoneLinkService : IUserPhoneLinkService
{
    private readonly IUserPhoneLinkRepository _userPhoneLinkRepository;
    private readonly ILinqClientService _linqClientService;
    private readonly LinqSettings _linqSettings;

    public UserPhoneLinkService(
        IUserPhoneLinkRepository userPhoneLinkRepository,
        ILinqClientService linqClientService,
        IOptions<LinqSettings> linqSettings)
    {
        _userPhoneLinkRepository = userPhoneLinkRepository;
        _linqClientService = linqClientService;
        _linqSettings = linqSettings.Value;
    }

    public async Task<UserPhoneLinkResponse?> GetByUserIdAsync(string userId)
    {
        var link = await _userPhoneLinkRepository.GetByUserIdAsync(userId);
        return link == null ? null : Map(link);
    }

    public async Task<UserPhoneLinkResponse> UpsertAsync(string userId, UpsertUserPhoneLinkRequest request)
    {
        var preferredChannel = NormalizePreferredChannel(request.PreferredChannel);
        var existing = await _userPhoneLinkRepository.GetByUserIdAsync(userId);

        var phoneLink = existing ?? new UserPhoneLink
        {
            UserId = userId
        };

        phoneLink.PreferredChannel = preferredChannel;

        if (preferredChannel == MessagingChannel.Telegram)
        {
            if (string.IsNullOrWhiteSpace(request.TelegramUsername))
            {
                throw new ArgumentException("Telegram username is required.");
            }

            var normalizedTelegramUsername = NormalizeTelegramUsername(request.TelegramUsername);
            var existingTelegramLink = await _userPhoneLinkRepository.GetByTelegramUsernameAsync(normalizedTelegramUsername);
            if (existingTelegramLink != null && existingTelegramLink.UserId != userId)
            {
                throw new ArgumentException("This Telegram account is already linked to another profile.");
            }

            var telegramIdentityChanged =
                !string.Equals(phoneLink.TelegramUsername, normalizedTelegramUsername, StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(existing?.PreferredChannel, MessagingChannel.Telegram, StringComparison.OrdinalIgnoreCase);

            phoneLink.TelegramUsername = normalizedTelegramUsername;

            if (telegramIdentityChanged)
            {
                ResetConversationState(phoneLink);
                phoneLink.TelegramChatId = null;
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                throw new ArgumentException("Phone number is required.");
            }

            var normalizedPhoneNumber = NormalizePhoneNumber(request.PhoneNumber);
            var linqIdentityChanged =
                !string.Equals(phoneLink.PhoneNumber, normalizedPhoneNumber, StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(existing?.PreferredChannel, MessagingChannel.Linq, StringComparison.OrdinalIgnoreCase);

            phoneLink.PhoneNumber = normalizedPhoneNumber;
            phoneLink.AssignedFromPhoneNumber = await ResolveAssignedFromPhoneNumberAsync(request.AssignedFromPhoneNumber);

            if (linqIdentityChanged)
            {
                ResetConversationState(phoneLink);
                phoneLink.LinqChatId = null;
            }
        }

        await _userPhoneLinkRepository.UpsertAsync(phoneLink);
        return Map(phoneLink);
    }

    public async Task<IReadOnlyList<LinqPhoneNumberDto>> GetAvailableLinesAsync()
    {
        return await _linqClientService.GetPhoneNumbersAsync();
    }

    private async Task<string> ResolveAssignedFromPhoneNumberAsync(string? requestedFromPhoneNumber)
    {
        if (!string.IsNullOrWhiteSpace(requestedFromPhoneNumber))
        {
            return NormalizePhoneNumber(requestedFromPhoneNumber);
        }

        if (!string.IsNullOrWhiteSpace(_linqSettings.DefaultFromPhoneNumber))
        {
            return NormalizePhoneNumber(_linqSettings.DefaultFromPhoneNumber);
        }

        var availableLines = await _linqClientService.GetPhoneNumbersAsync();
        var activeLine = availableLines.FirstOrDefault(line =>
            string.Equals(line.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase));

        if (activeLine != null)
        {
            return activeLine.PhoneNumber;
        }

        var firstLine = availableLines.FirstOrDefault();
        if (firstLine != null)
        {
            return firstLine.PhoneNumber;
        }

        throw new InvalidOperationException("No Linq sending number is configured or available.");
    }

    private static UserPhoneLinkResponse Map(UserPhoneLink phoneLink)
    {
        return new UserPhoneLinkResponse
        {
            PhoneNumber = phoneLink.PhoneNumber,
            AssignedFromPhoneNumber = phoneLink.AssignedFromPhoneNumber,
            TelegramUsername = phoneLink.TelegramUsername,
            LinqChatId = phoneLink.LinqChatId,
            TelegramChatId = phoneLink.TelegramChatId,
            PreferredChannel = phoneLink.PreferredChannel,
            HasInitiatedConversation = phoneLink.HasInitiatedConversation,
            FirstInboundMessageAt = phoneLink.FirstInboundMessageAt,
            LastInboundMessageAt = phoneLink.LastInboundMessageAt,
            LastOutboundMessageAt = phoneLink.LastOutboundMessageAt
        };
    }

    private static void ResetConversationState(UserPhoneLink phoneLink)
    {
        phoneLink.HasInitiatedConversation = false;
        phoneLink.FirstInboundMessageAt = null;
        phoneLink.LastInboundMessageAt = null;
        phoneLink.LastOutboundMessageAt = null;
    }

    private static string NormalizePhoneNumber(string input)
    {
        var trimmed = input.Trim();

        if (trimmed.StartsWith('+'))
        {
            var digits = new string(trimmed.Where(char.IsDigit).ToArray());
            ValidatePhoneDigits(digits);
            return $"+{digits}";
        }

        var numeric = new string(trimmed.Where(char.IsDigit).ToArray());

        if (numeric.Length == 10)
        {
            numeric = $"1{numeric}";
        }

        ValidatePhoneDigits(numeric);
        return $"+{numeric}";
    }

    private static void ValidatePhoneDigits(string digits)
    {
        if (digits.Length < 11 || digits.Length > 15)
        {
            throw new ArgumentException("Phone number must be a valid E.164-compatible number.");
        }
    }

    private static string NormalizePreferredChannel(string? preferredChannel)
    {
        var normalized = preferredChannel?.Trim().ToLowerInvariant();

        return normalized switch
        {
            MessagingChannel.Telegram => MessagingChannel.Telegram,
            _ => MessagingChannel.Linq
        };
    }

    private static string NormalizeTelegramUsername(string input)
    {
        var normalized = input.Trim().TrimStart('@').ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new ArgumentException("Telegram username is required.");
        }

        if (normalized.Length < 5 || normalized.Length > 32)
        {
            throw new ArgumentException("Telegram username must be between 5 and 32 characters.");
        }

        if (normalized.Any(ch => !(char.IsLetterOrDigit(ch) || ch == '_')))
        {
            throw new ArgumentException("Telegram username can only contain letters, numbers, and underscores.");
        }

        return normalized;
    }
}
