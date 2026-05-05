using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class LinqMessageChannelService : IMessageChannelService
{
    private readonly ILinqClientService _linqClientService;

    public LinqMessageChannelService(ILinqClientService linqClientService)
    {
        _linqClientService = linqClientService;
    }

    public string ChannelName => "linq";

    public async Task<MessageSendResult> SendTextMessageAsync(
        string recipientId,
        string messageText,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            var result = await _linqClientService.SendTextMessageAsync(
                recipientId,
                messageText,
                cancellationToken
            );

            return result != null
                ? MessageSendResult.Ok("linq")
                : MessageSendResult.Fail(
                    "linq",
                    "Linq is currently unavailable. The sandbox may be inactive or expired.",
                    errorCode: "linq_empty_response"
                );
        }
        catch (HttpRequestException ex)
        {
            return MessageSendResult.Fail(
                "linq",
                "Linq is currently unavailable. The sandbox may be inactive or expired.",
                errorCode: "linq_http_error",
                technicalMessage: ex.Message
            );
        }
        catch (TaskCanceledException ex)
        {
            return MessageSendResult.Fail(
                "linq",
                "Linq timed out while sending. Please try again shortly.",
                errorCode: "linq_timeout",
                technicalMessage: ex.Message
            );
        }
    }
}
