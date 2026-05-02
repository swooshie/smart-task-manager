namespace TodoApp.Api.DTOs;

public class UpsertUserPhoneLinkRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string? AssignedFromPhoneNumber { get; set; }
}
