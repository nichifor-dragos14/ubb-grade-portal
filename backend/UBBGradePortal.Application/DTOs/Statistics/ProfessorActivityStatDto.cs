namespace UBBGradePortal.Application.DTOs.Statistics;

public class ProfessorActivityStatDto
{
    public Guid ActivityId { get; set; }
    public string? ActivityName { get; set; }
    public int CompletedCount { get; set; }
    public double AverageGrade { get; set; }
}
