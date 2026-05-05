using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TodoApp.Api.Configuration;
using TodoApp.Api.Services.Interfaces;

namespace TodoApp.Api.Services;

public class TelegramBotService : ITelegramBotService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly TelegramSettings _settings;

    public TelegramBotService(HttpClient httpClient, IOptions<TelegramSettings> settings)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
    }

    public async Task<MessageSendResult> SendTextMessageAsync(
        string chatId,
        string messageText,
        CancellationToken cancellationToken = default
    )
    {
        if (string.IsNullOrWhiteSpace(_settings.BotToken) || string.IsNullOrWhiteSpace(chatId))
        {
            return MessageSendResult.Fail(
                "telegram",
                "Telegram is not configured correctly right now.",
                errorCode: "telegram_not_configured"
            );
        }

        var payload = new
        {
            chat_id = chatId,
            text = messageText
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/bot{_settings.BotToken}/sendMessage")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload, JsonOptions),
                Encoding.UTF8,
                "application/json"
            )
        };

        try
        {
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return MessageSendResult.Ok("telegram");
            }

            return MessageSendResult.Fail(
                "telegram",
                "Telegram is currently unavailable. Please try again shortly.",
                errorCode: "telegram_send_failed",
                statusCode: (int)response.StatusCode,
                technicalMessage: responseBody
            );
        }
        catch (HttpRequestException ex)
        {
            return MessageSendResult.Fail(
                "telegram",
                "Telegram is currently unavailable. Please try again shortly.",
                errorCode: "telegram_network_error",
                technicalMessage: ex.Message
            );
        }
        catch (TaskCanceledException ex)
        {
            return MessageSendResult.Fail(
                "telegram",
                "Telegram timed out while sending. Please try again shortly.",
                errorCode: "telegram_timeout",
                technicalMessage: ex.Message
            );
        }
    }
}
