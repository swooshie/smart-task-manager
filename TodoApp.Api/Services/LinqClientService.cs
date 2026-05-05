using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TodoApp.Api.Configuration;
using TodoApp.Api.DTOs;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class LinqClientService : ILinqClientService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _httpClient;
    private readonly LinqSettings _settings;

    public LinqClientService(HttpClient httpClient, IOptions<LinqSettings> settings)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
    }

    public async Task<IReadOnlyList<LinqPhoneNumberDto>> GetPhoneNumbersAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            return Array.Empty<LinqPhoneNumberDto>();
        }

        using var request = BuildRequest(HttpMethod.Get, "phone_numbers");
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var payload = await JsonSerializer.DeserializeAsync<ListPhoneNumbersResponse>(stream, JsonOptions, cancellationToken);

        var phoneNumbers = payload?.PhoneNumbers?
            .Select(number => new LinqPhoneNumberDto
            {
                PhoneNumber = number.PhoneNumber,
                Status = number.Status
            })
            .ToList();

        return phoneNumbers ?? new List<LinqPhoneNumberDto>();
    }

    public async Task<LinqCreateChatResult?> CreateChatAsync(
        string fromPhoneNumber,
        string toPhoneNumber,
        string initialMessage,
        CancellationToken cancellationToken = default
    )
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            return null;
        }

        var payload = new
        {
            from = fromPhoneNumber,
            to = new[] { toPhoneNumber },
            message = new
            {
                parts = new[]
                {
                    new
                    {
                        type = "text",
                        value = initialMessage
                    }
                }
            }
        };

        using var request = BuildJsonRequest(HttpMethod.Post, "chats", payload);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var chat = await JsonSerializer.DeserializeAsync<CreateChatResponse>(stream, JsonOptions, cancellationToken);

        if (chat == null)
        {
            return null;
        }

        return new LinqCreateChatResult
        {
            ChatId = chat.Id,
            MessageId = chat.LastMessage?.Id
        };
    }

    public async Task<LinqSendMessageResult?> SendTextMessageAsync(
        string chatId,
        string messageText,
        CancellationToken cancellationToken = default
    )
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            return null;
        }

        var payload = new
        {
            message = new
            {
                parts = new[]
                {
                    new
                    {
                        type = "text",
                        value = messageText
                    }
                }
            } 
        };

        using var request = BuildJsonRequest(HttpMethod.Post, $"chats/{chatId}/messages", payload);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var message = await JsonSerializer.DeserializeAsync<SendMessageResponse>(stream, JsonOptions, cancellationToken);

        if (message == null)
        {
            return null;
        }

        return new LinqSendMessageResult
        {
            ChatId = message.ChatId,
            MessageId = message.Id
        };
    }

    private HttpRequestMessage BuildRequest(HttpMethod method, string relativePath)
    {
        var request = new HttpRequestMessage(method, relativePath);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
        return request;
    }

    private HttpRequestMessage BuildJsonRequest(HttpMethod method, string relativePath, object payload)
    {
        var request = BuildRequest(method, relativePath);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions),
            Encoding.UTF8,
            "application/json"
        );
        return request;
    }

    private class ListPhoneNumbersResponse
    {
        [JsonPropertyName("phone_numbers")]
        public List<PhoneNumberItem>? PhoneNumbers { get; set; }
    }

    private class PhoneNumberItem
    {
        [JsonPropertyName("phone_number")]
        public string PhoneNumber { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }

    private class CreateChatResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("last_message")]
        public ChatMessage? LastMessage { get; set; }
    }

    private class SendMessageResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("chat_id")]
        public string ChatId { get; set; } = string.Empty;
    }

    private class ChatMessage
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
    }
}
