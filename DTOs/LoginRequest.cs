using System.ComponentModel.DataAnnotations;

namespace TodoApp.Api.DTOs;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
    [Required]
    public string Password { get; set; } = null!;
} 