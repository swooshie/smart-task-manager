using System.ComponentModel.DataAnnotations;

namespace TodoApp.Api.DTOs;

public class RecommendationRequest
{
    [Required]
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public List<string>? UserTasks { get; set; } = new();
}