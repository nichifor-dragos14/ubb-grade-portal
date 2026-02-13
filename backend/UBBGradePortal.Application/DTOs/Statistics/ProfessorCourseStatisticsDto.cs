namespace UBBGradePortal.Application.DTOs.Statistics;

public class ProfessorCourseStatisticsDto
{
    public Guid CourseId { get; set; }
    public string? CourseName { get; set; }
    public int TotalActivitiesCount { get; set; }
    public int EnrolledStudentsCount { get; set; }
    public int StudentsCompletedCount { get; set; }
    public double CompletionPercentage { get; set; }
    public double AverageGrade { get; set; }
    public Guid? LeastSolvedActivityId { get; set; }
    public string? LeastSolvedActivityName { get; set; }
    public int LeastSolvedActivitySubmissions { get; set; }
    public List<ProfessorActivityStatDto> ActivityStats { get; set; } = [];
}
