using System.ComponentModel.DataAnnotations;

namespace TodoApp.Api.DTOs;

public class SignupRequest
{
    [Required]
    public string Name { get; set; } = null!;
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = null!;   
}