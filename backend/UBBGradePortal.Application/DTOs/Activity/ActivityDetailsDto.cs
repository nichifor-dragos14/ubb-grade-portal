namespace UBBGradePortal.Application.DTOs.Activity;

public record ActivityDetailsDto(
    Guid Id,
    string Name,
    string? Description,
    List<ActivityDocumentDto> ActivityDocuments
);