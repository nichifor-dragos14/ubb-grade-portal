namespace UBBGradePortal.Application.DTOs.Activity;

public record PaginatedProfessorSolvedActivityDto(
    int Count,
    List<SolvedActivityProfessorDetailsDto> SolvedActivities
);
