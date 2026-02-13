namespace UBBGradePortal.Application.DTOs.Statistics;

public class StudentGeneralStatisticsDto
{
    public string? StudentName { get; set; }
    public int EnrolledCoursesCount { get; set; }
    public int TotalCoursesCount { get; set; }
    public int SolvedActivitiesCount { get; set; }
    public int TotalActivitiesCount { get; set; }
    public Guid? DefaultCourseId { get; set; }
    public List<StudentCourseOptionDto> Courses { get; set; } = [];
    public List<CourseDomainStatDto> TopDomains { get; set; } = [];
}
