using System.Globalization;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Leaderboard;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Domain.Enums;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class LeaderboardService : ILeaderboardService
{
    private readonly ISolvedActivityRepository _solvedActivityRepository;
    private readonly IBadgeRepository _badgeRepository;

    public LeaderboardService(
        ISolvedActivityRepository solvedActivityRepository,
        IBadgeRepository badgeRepository
    )
    {
        _solvedActivityRepository = solvedActivityRepository;
        _badgeRepository = badgeRepository;
    }

    public async Task<List<StudentLeaderboardEntryDto>> GetWeeklyTopStudents(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var (weekStart, weekEnd) = GetWeekRangeUtc(now);

        var counts = await _solvedActivityRepository.GetSubmissionCountsByUser(
            weekStart,
            weekEnd,
            cancellationToken
        );

        return MapLeaderboardEntries(counts);
    }

    public async Task<List<StudentLeaderboardEntryDto>> GetMonthlyTopStudents(int year, int month, CancellationToken cancellationToken)
    {
        var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = new DateTime(year, month, 28, 0, 0, 0, DateTimeKind.Utc);

        var counts = await _solvedActivityRepository.GetSubmissionCountsByUser(
            monthStart,
            monthEnd,
            cancellationToken
        );

        return MapLeaderboardEntries(counts);
    }

    public async Task<List<BadgeDto>> GetBadgesForStudent(Guid userId, CancellationToken cancellationToken)
    {
        var badges = await _badgeRepository.GetForUser(userId, cancellationToken);

        return badges
            .OrderByDescending(badge => badge.CreatedOn)
            .Select(badge => new BadgeDto
            {
                UserId = badge.UserId,
                CreatedOn = badge.CreatedOn,
                Month = badge.Month,
                Message = badge.Message,
                Position = badge.Position
            })
            .ToList();
    }

    public async Task<bool> AwardMonthlyBadges(int year, int month, CancellationToken cancellationToken)
    {
        var alreadyAwarded = await _badgeRepository.AnyForMonth(year, month, cancellationToken);

        if (alreadyAwarded)
        {
            return false;
        }

        var leaderboard = await GetMonthlyTopStudents(year, month, cancellationToken);

        if (leaderboard.Count == 0)
        {
            return false;
        }

        var monthName = CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(month);
        var createdOn = DateTime.UtcNow;

        var badges = leaderboard.Select(entry => new Badge
        {
            Id = Guid.NewGuid(),
            CreatedOn = createdOn,
            UserId = entry.UserId,
            Month = month,
            Position = entry.Position,
            Message = $"You were awarded this because you placed {GetOrdinal(entry.Position)} on submission leaderboard in {monthName} {year}"
        }).ToList();

        await _badgeRepository.AddRange(badges, cancellationToken);

        return true;
    }

    private static List<StudentLeaderboardEntryDto> MapLeaderboardEntries(List<SubmissionCountByUser> counts)
    {
        var ordered = counts
            .OrderByDescending(item => item.SubmissionsCount)
            .ThenBy(item => item.LastName)
            .ThenBy(item => item.FirstName)
            .Take(10)
            .ToList();

        var position = 1;

        return ordered
            .Select(item => new StudentLeaderboardEntryDto
            {
                UserId = item.UserId,
                Name = string.Join(" ", new[] { item.FirstName, item.LastName }
                    .Where(part => !string.IsNullOrWhiteSpace(part))),
                SubmissionsCount = item.SubmissionsCount,
                Position = position++
            })
            .ToList();
    }

    private static (DateTime Start, DateTime End) GetWeekRangeUtc(DateTime nowUtc)
    {
        var date = nowUtc.Date;
        var dayOfWeek = (int)date.DayOfWeek;
        var offset = (dayOfWeek + 6) % 7;
        var start = date.AddDays(-offset);

        return (start, start.AddDays(7));
    }

    private static string GetOrdinal(int value)
    {
        var absValue = Math.Abs(value);
        var lastTwo = absValue % 100;

        if (lastTwo is >= 11 and <= 13)
        {
            return $"{value}th";
        }

        return (absValue % 10) switch
        {
            1 => $"{value}st",
            2 => $"{value}nd",
            3 => $"{value}rd",
            _ => $"{value}th"
        };
    }
}
