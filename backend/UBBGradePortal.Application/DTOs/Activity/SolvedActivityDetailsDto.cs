namespace UBBGradePortal.Application.DTOs.Activity;

public record SolvedActivityDetailsDto(
    Guid Id,
    DateTime? UpdatedOn,
    ActivityDetailsDto Activity,
    List<SolvedActivityDocumentDto> SolvedActivityDocuments
);
