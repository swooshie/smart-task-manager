namespace TodoApp.Api.Services;

public class MessageSendResult
{
    public bool Success { get; init; }
    public string Channel { get; init; } = string.Empty;
    public int? StatusCode { get; init; }
    public string? ErrorCode { get; init; }
    public string? TechnicalMessage { get; init; }
    public string? UserMessage { get; init; }

    public static MessageSendResult Ok(string channel) => new()
    {
        Success = true,
        Channel = channel
    };

    public static MessageSendResult Fail(
        string channel,
        string userMessage,
        string? errorCode = null,
        int? statusCode = null,
        string? technicalMessage = null) => new()
    {
        Success = false,
        Channel = channel,
        UserMessage = userMessage,
        ErrorCode = errorCode,
        StatusCode = statusCode,
        TechnicalMessage = technicalMessage
    };
}
