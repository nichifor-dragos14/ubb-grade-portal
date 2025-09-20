namespace UBBGradePortal.Application.DTOs.Course;

public record UpdateCourseDto(
    Guid Id,
    string Name,
    string Description
);
