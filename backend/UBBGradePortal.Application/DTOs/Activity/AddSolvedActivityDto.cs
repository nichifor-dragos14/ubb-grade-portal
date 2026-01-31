namespace UBBGradePortal.Application.DTOs.Activity;

public record AddSolvedActivityDto(
    Guid ActivityId,
    List<AddSolvedActivityDocumentDto> SolvedActivityDocuments);
