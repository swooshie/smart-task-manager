using System.ComponentModel.DataAnnotations;

namespace TodoApp.Api.DTOs;

public class ReportLocationEventRequest
{
    [Range(-90, 90)]
    public double Latitude { get; set; }

    [Range(-180, 180)]
    public double Longitude { get; set; }
}
