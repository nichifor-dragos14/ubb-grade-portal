namespace UBBGradePortal.Application.DTOs.Course;

public record CourseDetailsDto(
    Guid Id,
    string Name,
    string? Description,
    string CourseDomainName
);

