using TodoApp.Api.DTOs;

namespace TodoApp.Api.Services.Interfaces;

public interface IRecommendationService
{
    Task<RecommendationResponse> GetRecommendationsAsync(RecommendationRequest request);
}

