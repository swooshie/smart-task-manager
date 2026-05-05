namespace TodoApp.Api.DTOs;

public class UserPhoneLinkResponse
{
    public string? PhoneNumber { get; set; }
    public string? AssignedFromPhoneNumber { get; set; }
    public string? TelegramUsername { get; set; }
    public string? LinqChatId { get; set; }
    public string? TelegramChatId { get; set; }
    public string PreferredChannel { get; set; } = Models.MessagingChannel.Linq;
    public bool HasInitiatedConversation { get; set; }
    public DateTime? FirstInboundMessageAt { get; set; }
    public DateTime? LastInboundMessageAt { get; set; }
    public DateTime? LastOutboundMessageAt { get; set; }
}
