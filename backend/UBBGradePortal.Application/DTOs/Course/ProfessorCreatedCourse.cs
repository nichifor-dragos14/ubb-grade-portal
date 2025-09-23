namespace UBBGradePortal.Application.DTOs.Course;

public record ProfessorCreatedCourse(
    Guid CourseId,
    string Name,
    string CourseDomainName,
    DateTime? CreatedOn,
    int NumberOfEntrollments,
    int NumberOfActivities
);