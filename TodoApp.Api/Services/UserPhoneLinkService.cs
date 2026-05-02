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
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            throw new ArgumentException("Phone number is required.");
        }

        var normalizedPhoneNumber = NormalizePhoneNumber(request.PhoneNumber);
        var assignedFromPhoneNumber = await ResolveAssignedFromPhoneNumberAsync(request.AssignedFromPhoneNumber);
        var existing = await _userPhoneLinkRepository.GetByUserIdAsync(userId);

        var phoneLink = existing ?? new UserPhoneLink
        {
            UserId = userId
        };

        phoneLink.PhoneNumber = normalizedPhoneNumber;
        phoneLink.AssignedFromPhoneNumber = assignedFromPhoneNumber;

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
            LinqChatId = phoneLink.LinqChatId,
            HasInitiatedConversation = phoneLink.HasInitiatedConversation,
            FirstInboundMessageAt = phoneLink.FirstInboundMessageAt,
            LastInboundMessageAt = phoneLink.LastInboundMessageAt,
            LastOutboundMessageAt = phoneLink.LastOutboundMessageAt
        };
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
}
