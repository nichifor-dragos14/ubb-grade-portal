namespace UBBGradePortal.Application.DTOs.Statistics;

public class StudentCourseStatisticsDto
{
    public Guid CourseId { get; set; }
    public string? CourseName { get; set; }
    public int TotalActivitiesCount { get; set; }
    public int ActivitiesWithSolvedCount { get; set; }
    public int TotalSolvedActivitiesCount { get; set; }
    public int SubmittedCount { get; set; }
    public int CompletedCount { get; set; }
    public int ReturnedCount { get; set; }
    public double CompletionPercentage { get; set; }
    public double StudentAverageGrade { get; set; }
    public double AllStudentsAverageGrade { get; set; }
}
