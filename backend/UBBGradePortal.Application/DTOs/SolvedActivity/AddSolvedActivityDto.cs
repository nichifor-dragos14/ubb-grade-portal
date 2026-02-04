using UBBGradePortal.Application.DTOs.Document;

namespace UBBGradePortal.Application.DTOs.SolvedActivity;

public record AddSolvedActivityDto(
    Guid ActivityId,
    List<AddDocumentDto> Documents
);
