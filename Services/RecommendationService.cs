using TodoApp.Api.DTOs;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class RecommendationService : IRecommendationService
{
    public Task<RecommendationResponse> GetRecommendationsAsync(RecommendationRequest request)
    {
        // Placeholder implementation - in a real application, this would call an AI service
        var input = $"{request.Title} {request.Description}".ToLower();
        var suggestions = new HashSet<string>();

        if (input.Contains("milk"))
        {
            suggestions.Add("Buy bread");
            suggestions.Add("Buy eggs");
            suggestions.Add("Buy butter");
        }
        if (input.Contains("bread"))
        {
            suggestions.Add("Buy jam");
            suggestions.Add("Buy butter");
        }
        if (input.Contains("rice"))
        {
            suggestions.Add("Buy beans");
            suggestions.Add("Buy vegetables");
        }
        if (input.Contains("exercise"))
        {
            suggestions.Add("Go for a run");
            suggestions.Add("Do yoga");
            suggestions.Add("Lift weights");
        }
        if(input.Contains("interview"))
        {
            suggestions.Add("Review common interview questions");
            suggestions.Add("Practice coding problems");
            suggestions.Add("Research the company");
        }
        if(input.Contains("assignment") || input.Contains("homework"))
        {
            suggestions.Add("Break down the task into smaller steps");
            suggestions.Add("Set specific goals for each step");
            suggestions.Add("Schedule dedicated time to work on it");
        }
        return Task.FromResult(new RecommendationResponse
        {
            Suggestions = suggestions.ToList()
        });
    }
}

