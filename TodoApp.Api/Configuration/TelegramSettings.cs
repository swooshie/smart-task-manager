namespace TodoApp.Api.Configuration;

public class TelegramSettings
{
    public string BotToken { get; set; } = string.Empty;
    public string BotUsername { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
}
