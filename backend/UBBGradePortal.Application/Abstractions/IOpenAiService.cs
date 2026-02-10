using UBBGradePortal.Application.DTOs.Ai;

namespace UBBGradePortal.Application.Abstractions;

public interface IOpenAiService
{
    Task<OpenAiSolvedActivityFeedback> GenerateSolvedActivitySummary(Guid solvedActivityId, Guid loggedUserId, CancellationToken cancellationToken);
}
