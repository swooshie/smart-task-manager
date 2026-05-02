using System.ComponentModel.DataAnnotations;

namespace TodoApp.Api.DTOs;

public class CreateSavedPlaceRequest
{
    [Required]
    [MinLength(1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public string Category { get; set; } = string.Empty;

    [Range(-90, 90)]
    public double Latitude { get; set; }

    [Range(-180, 180)]
    public double Longitude { get; set; }

    [Range(25, 5000)]
    public double RadiusMeters { get; set; } = 250;
}
