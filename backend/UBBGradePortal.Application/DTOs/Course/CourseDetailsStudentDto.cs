using UBBGradePortal.Application.DTOs.Activity;

namespace UBBGradePortal.Application.DTOs.Course;

public record CourseDetailsStudentDto(
    Guid Id,
    string Name,
    string? Description,
    string CourseDomainName,
    List<ActivityDto> Activities
);
