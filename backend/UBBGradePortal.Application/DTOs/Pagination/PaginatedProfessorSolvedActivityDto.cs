using UBBGradePortal.Application.DTOs.SolvedActivity;

namespace UBBGradePortal.Application.DTOs.Pagination;

public record PaginatedProfessorSolvedActivityDto(
    int Count,
    List<SolvedActivityDto> SolvedActivities
);
