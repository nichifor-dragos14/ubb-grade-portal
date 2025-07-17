using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UBBGradePortal.Infrastructure.EntityFramework;

namespace UBBGradePortal.Infrastructure.ExtensionMethods;

internal class AutomaticMigrationsService(IServiceProvider serviceProvider) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = serviceProvider.CreateScope();

        using var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AutomaticMigrationsService>>();

        try
        {
            logger.LogInformation("BEGIN MIGRATION");

            await context.Database.MigrateAsync(cancellationToken);

            logger.LogInformation("MIGRATION SUCCESFUL!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating the database.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}