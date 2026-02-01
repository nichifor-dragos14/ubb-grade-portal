using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.DTOs.Activity;

public record ActivityStudentDto(
    Guid Id,
    string Name,
    string? Description,
    int NumberOfDocuments,
    DateTime? CreatedOn,
    SolvedActivityStatus? SolvedStatus
);
