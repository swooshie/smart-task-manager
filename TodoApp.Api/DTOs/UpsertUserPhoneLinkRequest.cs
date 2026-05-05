namespace TodoApp.Api.DTOs;

public class UpsertUserPhoneLinkRequest
{
    public string? PhoneNumber { get; set; }
    public string? AssignedFromPhoneNumber { get; set; }
    public string? TelegramUsername { get; set; }
    public string PreferredChannel { get; set; } = Models.MessagingChannel.Linq;
}
