namespace UBBGradePortal.Application.DTOs.Activity;

public record UpdateSolvedActivityDto(
    List<AddSolvedActivityDocumentDto> SolvedActivityDocuments
);
