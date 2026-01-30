namespace UBBGradePortal.Application.DTOs.Activity;

public record AddSolvedActivityDto(
    Guid ActivityId,
    Guid UserId,
    List<AddSolvedActivityDocumentDto> SolvedActivityDocuments);
