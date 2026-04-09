using System.ComponentModel.DataAnnotations;

namespace TodoApp.Api.DTOs;

public class CreateTaskRequest
{
    [Required]
    [MinLength(1)]
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string Priority { get; set; } = "medium"; // Default priority
    public string? Category { get; set; }
    public DateTime? DueDate { get; set; }
}