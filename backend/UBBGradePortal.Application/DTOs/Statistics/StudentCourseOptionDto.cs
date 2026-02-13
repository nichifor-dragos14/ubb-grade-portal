namespace UBBGradePortal.Application.DTOs.Statistics;

public class StudentCourseOptionDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public int TotalActivitiesCount { get; set; }
    public int SolvedActivitiesCount { get; set; }
}
