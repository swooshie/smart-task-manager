using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TodoApp.Api.DTOs;

public class UpdateTaskRequest
{
    [MinLength(1)]
    public string? Title { get; set; }
    public string? Description { get; set; }
    [JsonPropertyName("isCompleted")]
    public bool? IsComplete { get; set; }
    public string? Priority { get; set; }
    public string? Category { get; set; }
    public DateTime? DueDate { get; set; }
}
