
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.DTOs.SolvedActivity;

public record GradeSolvedActivityDto(
    SolvedActivityStatus Status,
    string? ProfessorComment,
    int Grade
);
