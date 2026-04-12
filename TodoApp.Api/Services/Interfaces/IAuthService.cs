using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> SignupAsync(SignupRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
}