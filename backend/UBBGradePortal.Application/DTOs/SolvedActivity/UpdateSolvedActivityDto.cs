using UBBGradePortal.Application.DTOs.Document;

namespace UBBGradePortal.Application.DTOs.SolvedActivity;

public record UpdateSolvedActivityDto(
    List<AddDocumentDto> Documents
);
