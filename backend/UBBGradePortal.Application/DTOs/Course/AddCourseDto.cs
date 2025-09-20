namespace UBBGradePortal.Application.DTOs.Course;

public record AddCourseDto(
    string Name,
    string Description,
    Guid CourseDomainId
);
