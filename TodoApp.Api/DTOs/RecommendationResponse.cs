using System.ComponentModel.DataAnnotations;

namespace TodoApp.Api.DTOs;

public class RecommendationResponse
{
    public List<string> Suggestions { get; set; } = new List<string>();
}