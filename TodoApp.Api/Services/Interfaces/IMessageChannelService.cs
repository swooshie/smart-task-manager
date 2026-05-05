namespace TodoApp.Api.Services.Interfaces;

public interface IMessageChannelService
{
    string ChannelName { get; }

    Task<MessageSendResult> SendTextMessageAsync(
        string recipientId,
        string messageText,
        CancellationToken cancellationToken = default
    );
}
