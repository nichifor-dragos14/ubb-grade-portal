namespace UBBGradePortal.Infrastructure.Abstractions;

public record SubmissionCountByUser(
    Guid UserId,
    string FirstName,
    string LastName,
    int SubmissionsCount
);
