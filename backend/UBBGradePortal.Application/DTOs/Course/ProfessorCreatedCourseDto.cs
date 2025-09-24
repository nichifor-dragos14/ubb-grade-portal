namespace UBBGradePortal.Application.DTOs.Course;

public record ProfessorCreatedCourseDto(
    Guid CourseId,
    string Name,
    string CourseDomainName,
    DateTime? CreatedOn,
    int NumberOfEntrollments,
    int NumberOfActivities
);