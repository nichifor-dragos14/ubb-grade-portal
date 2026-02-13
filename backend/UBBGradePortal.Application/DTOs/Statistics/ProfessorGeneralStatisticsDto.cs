namespace UBBGradePortal.Application.DTOs.Statistics;

public class ProfessorGeneralStatisticsDto
{
    public string? ProfessorName { get; set; }
    public int TotalCoursesCreated { get; set; }
    public int TotalActivitiesCreated { get; set; }
    public Guid? DefaultCourseId { get; set; }
    public List<ProfessorCourseOptionDto> Courses { get; set; } = [];
    public List<ProfessorCoursePopularityDto> MostEnrolledCourses { get; set; } = [];
    public List<WeeklySubmissionDto> WeeklySubmissions { get; set; } = [];
}
