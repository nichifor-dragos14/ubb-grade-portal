using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Application.DTOs.Document;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.DTOs.SolvedActivity;

public record SolvedActivityDto(
    Guid? Id,
    SolvedActivityStatus? Status,
    int? Grade,
    string? ProfessorComment,
    DateTime? CreatedOn,
    DateTime? UpdatedOn,
    string? SolvedByName,
    string? CourseName,
    ActivityDto? Activity,
    List<DocumentDto> Documents
);
