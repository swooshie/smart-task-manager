namespace TodoApp.Api.DTOs;

public class UserPhoneLinkResponse
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string AssignedFromPhoneNumber { get; set; } = string.Empty;
    public string? LinqChatId { get; set; }
    public bool HasInitiatedConversation { get; set; }
    public DateTime? FirstInboundMessageAt { get; set; }
    public DateTime? LastInboundMessageAt { get; set; }
    public DateTime? LastOutboundMessageAt { get; set; }
}
