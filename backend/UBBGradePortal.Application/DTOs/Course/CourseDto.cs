using UBBGradePortal.Application.DTOs.Activity;

namespace UBBGradePortal.Application.DTOs.Course;

public class CourseDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? CourseDomainName { get; set; }
    public bool? AssistedLlmEvaluation { get; set; }
    public Guid? CourseDomainId { get; set; }
    public DateTime? CreatedOn { get; set; }
    public int? NumberOfEntrollments { get; set; }
    public int? NumberOfActivities { get; set; }
    public int? NumberOfSolvedActivities { get; set; }
    public List<ActivityDto>? Activities { get; set; } = [];
}
