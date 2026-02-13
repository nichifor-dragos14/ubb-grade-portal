namespace UBBGradePortal.Application.DTOs.Statistics;

public class ProfessorCoursePopularityDto
{
    public Guid CourseId { get; set; }
    public string? CourseName { get; set; }
    public int EnrolledCount { get; set; }
}
