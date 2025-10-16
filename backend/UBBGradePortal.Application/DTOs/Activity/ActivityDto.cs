namespace UBBGradePortal.Application.DTOs.Activity;

public record ActivityDto(
    Guid Id,
    string Name,
    string? Description,
    int NumberOfDocuments,
    DateTime? CreatedOn
);