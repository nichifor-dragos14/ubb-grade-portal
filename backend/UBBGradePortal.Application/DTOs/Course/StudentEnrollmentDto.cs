namespace UBBGradePortal.Application.DTOs.Course;

public record StudentEnrollmentDto(
    Guid CourseId,
    string CourseName,
    string CourseDomainName,
    DateTime? CreatedOn,
    int TotalNumberOfActivities,
    int NumberOfSolvedActivities
);