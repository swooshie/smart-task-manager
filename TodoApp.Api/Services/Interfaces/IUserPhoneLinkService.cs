using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services.Interfaces;

public interface IUserPhoneLinkService
{
    Task<UserPhoneLinkResponse?> GetByUserIdAsync(string userId);
    Task<UserPhoneLinkResponse> UpsertAsync(string userId, UpsertUserPhoneLinkRequest request);
    Task<IReadOnlyList<LinqPhoneNumberDto>> GetAvailableLinesAsync();
}
