using TodoApp.Api.Models;

namespace TodoApp.Api.Repositories.Interfaces;

public interface IUserPhoneLinkRepository
{
    Task<UserPhoneLink?> GetByUserIdAsync(string userId);
    Task<UserPhoneLink?> GetByPhoneNumberAsync(string phoneNumber);
    Task<UserPhoneLink?> GetByTelegramUsernameAsync(string username);
    Task UpsertAsync(UserPhoneLink phoneLink);
}
