using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.DTOs.Activity;

public record SolvedActivityDetailsDto(
    Guid Id,
    SolvedActivityStatus Status,
    int Grade,
    string? ProfessorComment,
    DateTime? CreatedOn,
    DateTime? UpdatedOn,
    ActivityDetailsDto Activity,
    List<SolvedActivityDocumentDto> SolvedActivityDocuments
);
