using TodoApp.Api.Models;

namespace TodoApp.Api.Services.Interfaces;

public interface ILinqInboundMessageService
{
    Task<string?> HandleAsync(UserPhoneLink phoneLink, string messageText);
}
