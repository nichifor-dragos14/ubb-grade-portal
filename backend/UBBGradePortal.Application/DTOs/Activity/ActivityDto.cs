using UBBGradePortal.Application.DTOs.Document;
using UBBGradePortal.Application.DTOs.SolvedActivity;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.DTOs.Activity;

public record ActivityDto(
    Guid? Id,
    string? Name,
    string? Description,
    DateTime? CreatedOn,
    SolvedActivityStatus? SolvedActivityStatus,
    int? NumberOfDocuments,
    List<DocumentDto> Documents,
    List<SolvedActivityDto> SolvedActivities
);