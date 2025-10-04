namespace UBBGradePortal.Application.DTOs.Activity;

public record AddActivityDto(
    Guid CourseId,
    string Name,
    string? Description
);
