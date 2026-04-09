using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodoApp.Api.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }
    [BsonElement("name")]
    public string Name { get; set; }
    [BsonElement("email")]
    public string Email { get; set; }
    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; }
    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}