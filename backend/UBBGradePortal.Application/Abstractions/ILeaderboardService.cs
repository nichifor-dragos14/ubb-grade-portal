using UBBGradePortal.Application.DTOs.Leaderboard;

namespace UBBGradePortal.Application.Abstractions;

public interface ILeaderboardService
{
    Task<List<StudentLeaderboardEntryDto>> GetWeeklyTopStudents(CancellationToken cancellationToken);
    Task<List<StudentLeaderboardEntryDto>> GetMonthlyTopStudents(int year, int month, CancellationToken cancellationToken);
    Task<List<BadgeDto>> GetBadgesForStudent(Guid userId, CancellationToken cancellationToken);
    Task<bool> AwardMonthlyBadges(int year, int month, CancellationToken cancellationToken);
}
