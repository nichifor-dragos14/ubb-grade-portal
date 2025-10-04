using UBBGradePortal.Application.DTOs.Activity;

namespace UBBGradePortal.Application.DTOs.Course;

public record CourseDetailsDto(
    Guid Id,
    string Name,
    string? Description,
    string CourseDomainName,
    List<ActivityDto> Activities
);

