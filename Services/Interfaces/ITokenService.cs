using TodoApp.Api.Models;

namespace TodoApp.Api.Services.Interfaces;

public interface ITokenService
{
    string CreateToken(User user);
}