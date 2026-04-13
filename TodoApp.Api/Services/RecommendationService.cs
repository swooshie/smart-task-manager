using TodoApp.Api.DTOs;
using TodoApp.Api.Services.Interfaces;
using TodoApp.Api.Configuration;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;
using TodoApp.Api.Repositories.Interfaces;

namespace TodoApp.Api.Services;

public class RecommendationService : IRecommendationService
{
    private readonly HttpClient _httpClient;
    private readonly RecommendationServiceSettings _settings;
    private readonly ICacheService _cacheService;
    private readonly ITaskRepository _taskRepository;
    public RecommendationService(HttpClient httpClient, IOptions<RecommendationServiceSettings> settings, 
    ICacheService cacheService, ITaskRepository taskRepository)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _cacheService = cacheService;
        _taskRepository = taskRepository;
    }
    public async Task<RecommendationResponse> GetRecommendationsAsync(
        string userId, RecommendationRequest request)
    {

        if (string.IsNullOrWhiteSpace(_settings.BaseUrl))
        {
            return new RecommendationResponse
            {
                Suggestions = new List<string>()
            };
        }

        // check cache first
        try
        {   
            var normalizedTitle = request.Title.Trim().ToLowerInvariant();
            var normalizedDescription = (request.Description ?? "").Trim().ToLowerInvariant();
            var cacheKey = $"recommendations:{normalizedTitle}:{normalizedDescription}";

            var cached = await _cacheService.GetAsync<RecommendationResponse>(cacheKey);
            if (cached != null)        {
                return cached;
            }

            var userTasks = await _taskRepository.GetByUserIdAsync(userId); // get user's existing tasks

            request.UserTasks = userTasks.
                Where(t => !string.IsNullOrWhiteSpace(t.Title))
                .Select(t => t.Title)
                .ToList();

            var payload = JsonSerializer.Serialize(
                request,
                new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                }
            );
            var content = new StringContent(payload, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_settings.BaseUrl}/recommend", content);

            if (!response.IsSuccessStatusCode)
            {
                return new RecommendationResponse
                {
                    Suggestions = new List<string>()
                };
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<RecommendationResponse>(responseBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10));

            return result ?? new RecommendationResponse
            {
                Suggestions = new List<string>()
            };  
        }
        catch
        {
            return new RecommendationResponse
            {
                Suggestions = new List<string>()
            };
        }

        
    }
}

