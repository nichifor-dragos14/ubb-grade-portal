using UBBGradePortal.Application.DTOs.Ai;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Abstractions;

public interface IOpenAiService
{
    Task<OpenAiSolvedActivityFeedback> GenerateSolvedActivitySummary(Guid solvedActivityId, Guid loggedUserId, CancellationToken cancellationToken);
    Task<OpenAiCourseRecommendationResult> RecommendCourseSelections(string phrase, List<CourseDomain> courseDomains, List<Course> courses, CancellationToken cancellationToken);
}
