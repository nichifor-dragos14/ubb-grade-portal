namespace UBBGradePortal.Application.DTOs.SolvedActivity;

public record PaginatedProfessorSolvedActivityDto(
    int Count,
    List<SolvedActivityDto> SolvedActivities
);
