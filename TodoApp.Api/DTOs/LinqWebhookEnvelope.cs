using System.Text.Json.Serialization;

namespace TodoApp.Api.DTOs;

public class LinqWebhookEnvelope
{
    [JsonPropertyName("event_type")]
    public string EventType { get; set; } = string.Empty;

    [JsonPropertyName("event_id")]
    public string EventId { get; set; } = string.Empty;

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("data")]
    public LinqWebhookMessageData? Data { get; set; }
}

public class LinqWebhookMessageData
{
    [JsonPropertyName("chat")]
    public LinqWebhookChat? Chat { get; set; }

    [JsonPropertyName("chat_id")]
    public string? ChatId { get; set; }

    [JsonPropertyName("sender_handle")]
    public LinqWebhookHandle? SenderHandle { get; set; }

    [JsonPropertyName("from")]
    public string? From { get; set; }

    [JsonPropertyName("message")]
    public LinqWebhookLegacyMessage? Message { get; set; }

    [JsonPropertyName("parts")]
    public List<LinqWebhookMessagePart>? Parts { get; set; }
}

public class LinqWebhookChat
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
}

public class LinqWebhookHandle
{
    [JsonPropertyName("handle")]
    public string Handle { get; set; } = string.Empty;
}

public class LinqWebhookLegacyMessage
{
    [JsonPropertyName("parts")]
    public List<LinqWebhookMessagePart>? Parts { get; set; }
}

public class LinqWebhookMessagePart
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public string? Value { get; set; }
}
