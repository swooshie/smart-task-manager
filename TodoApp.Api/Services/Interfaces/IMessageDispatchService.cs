using TodoApp.Api.Models;

namespace TodoApp.Api.Services.Interfaces;

public interface IMessageDispatchService
{
    string ResolveChannelName(UserPhoneLink link);
    bool CanSend(UserPhoneLink link);
    Task<MessageSendResult> SendTextMessageAsync(
        UserPhoneLink link,
        string messageText,
        CancellationToken cancellationToken = default
    );
}
