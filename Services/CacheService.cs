using System.Text.Json;
using StackExchange.Redis;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services.Interfaces;

public class CacheService : ICacheService
{
    private readonly IDatabase _database;

    public CacheService(IConnectionMultiplexer redis)
    {
        _database = redis.GetDatabase();
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        var json = JsonSerializer.Serialize(value);
        await _database.StringSetAsync(key, json);
        if(expiration.HasValue)
        {
            await _database.KeyExpireAsync(key, expiration);
        }
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var json = await _database.StringGetAsync(key);
        if (json.IsNullOrEmpty) return default;
        return JsonSerializer.Deserialize<T>(json.ToString());
    }

    public async Task RemoveAsync(string key)
    {
        await _database.KeyDeleteAsync(key);
    }
}
