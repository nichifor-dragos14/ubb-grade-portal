using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UBBGradePortal.Application.Abstractions;

namespace UBBGradePortal.WebApi.Jobs;

internal class MonthlyBadgeJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MonthlyBadgeJob> _logger;

    public MonthlyBadgeJob(IServiceProvider serviceProvider, ILogger<MonthlyBadgeJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunOnce(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Monthly badge job failed");
            }

            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }

    private async Task RunOnce(CancellationToken stoppingToken)
    {
        var now = DateTime.UtcNow;

        if (now.Day != 28)
        {
            return;
        }

        using var scope = _serviceProvider.CreateScope();
        var leaderboardService = scope.ServiceProvider.GetRequiredService<ILeaderboardService>();

        var created = await leaderboardService.AwardMonthlyBadges(now.Year, now.Month, stoppingToken);

        if (created)
        {
            _logger.LogInformation("Monthly badges awarded for {Month}/{Year}", now.Month, now.Year);
        }
    }
}
