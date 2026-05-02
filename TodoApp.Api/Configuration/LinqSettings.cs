namespace TodoApp.Api.Configuration;

public class LinqSettings
{
    public string BaseUrl { get; set; } = "https://api.linqapp.com/api/partner/v3";
    public string ApiKey { get; set; } = string.Empty;
    public string? DefaultFromPhoneNumber { get; set; }
    public string? WebhookSecret { get; set; }
    public string WebhookVersion { get; set; } = "2026-02-03";
}
