namespace UBBGradePortal.Application.DTOs.Statistics;

public class ProfessorCourseOptionDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public int SubmissionsCount { get; set; }
    public int ActivitiesCount { get; set; }
}
