namespace UBBGradePortal.Application.DTOs.Course;

public class CourseDto
{
    public Guid CourseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CourseDomainName { get; set; } = string.Empty;
}
