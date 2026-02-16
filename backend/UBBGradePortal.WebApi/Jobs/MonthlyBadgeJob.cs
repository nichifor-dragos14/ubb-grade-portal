using Quartz;
using UBBGradePortal.Application.Abstractions;

namespace UBBGradePortal.WebApi.Jobs;

internal class MonthlyBadgeJob : IJob
{
    private readonly ILeaderboardService _leaderboardService;
    private readonly ILogger<MonthlyBadgeJob> _logger;

    public MonthlyBadgeJob(ILeaderboardService leaderboardService, ILogger<MonthlyBadgeJob> logger)
    {
        _leaderboardService = leaderboardService;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        var now = DateTime.UtcNow;
        var created = await _leaderboardService.AwardMonthlyBadges(
            now.Year,
            now.Month,
            context.CancellationToken);

        if (created)
        {
            _logger.LogInformation("Monthly badges awarded for {Month}/{Year}", now.Month, now.Year);
        }
    }
}
