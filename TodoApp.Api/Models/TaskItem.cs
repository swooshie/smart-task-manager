using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace TodoApp.Api.Models;

public class TaskItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }
    [BsonElement("userId")]
    public string UserId { get; set; }
    [BsonElement("title")]
    public string Title { get; set; }
    [BsonElement("description")]
    public string? Description { get; set; }
    
    [BsonElement("priority")]
    public string Priority { get; set; } = "medium";
    [BsonElement("category")]
    public string? Category { get; set; }
    [BsonElement("dueDate")]
    public DateTime? DueDate { get; set; }
    [BsonElement("isComplete")]
    [JsonPropertyName("isCompleted")]
    public bool IsComplete { get; set; }
    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}
