using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services.Interfaces;

public interface ILinqClientService
{
    Task<IReadOnlyList<LinqPhoneNumberDto>> GetPhoneNumbersAsync(CancellationToken cancellationToken = default);
    Task<LinqCreateChatResult?> CreateChatAsync(
        string fromPhoneNumber,
        string toPhoneNumber,
        string initialMessage,
        CancellationToken cancellationToken = default
    );
    Task<LinqSendMessageResult?> SendTextMessageAsync(
        string chatId,
        string messageText,
        CancellationToken cancellationToken = default
    );
}
