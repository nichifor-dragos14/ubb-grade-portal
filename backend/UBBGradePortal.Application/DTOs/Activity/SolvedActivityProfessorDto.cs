using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.DTOs.Activity;

public record SolvedActivityProfessorDto(
    Guid Id,
    SolvedActivityStatus Status,
    string? SolvedByName,
    string? CourseName,
    int Grade,
    DateTime? CreatedOn,
    DateTime? UpdatedOn,
    ActivityDetailsDto Activity
);

