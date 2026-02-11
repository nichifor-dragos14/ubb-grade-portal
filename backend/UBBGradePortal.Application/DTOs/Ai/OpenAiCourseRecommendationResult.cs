namespace UBBGradePortal.Application.DTOs.Ai;

public class OpenAiCourseRecommendationResult
{
    public List<string> CourseDomainIds { get; set; } = [];
    public List<string> CourseIds { get; set; } = [];
}
