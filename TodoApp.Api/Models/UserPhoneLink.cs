using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodoApp.Api.Models;

public class UserPhoneLink
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonElement("userId")]
    public string UserId { get; set; } = null!;

    [BsonElement("phoneNumber")]
    public string PhoneNumber { get; set; } = null!;

    [BsonElement("assignedFromPhoneNumber")]
    public string AssignedFromPhoneNumber { get; set; } = null!;

    [BsonElement("linqChatId")]
    public string? LinqChatId { get; set; }

    [BsonElement("hasInitiatedConversation")]
    public bool HasInitiatedConversation { get; set; }

    [BsonElement("firstInboundMessageAt")]
    public DateTime? FirstInboundMessageAt { get; set; }

    [BsonElement("lastInboundMessageAt")]
    public DateTime? LastInboundMessageAt { get; set; }

    [BsonElement("lastOutboundMessageAt")]
    public DateTime? LastOutboundMessageAt { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
