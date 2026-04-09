using System.ComponentModel.DataAnnotations;

namespace TodoApp.Api.DTOs;

public class UpdateTaskRequest
{
    [MinLength(1)]
    public string? Title { get; set; }
    public string? Description { get; set; }
    public bool? IsComplete { get; set; }
    public string? Priority { get; set; }
    public string? Category { get; set; }
    public DateTime? DueDate { get; set; }
}