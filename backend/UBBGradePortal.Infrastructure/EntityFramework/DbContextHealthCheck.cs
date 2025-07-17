using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace UBBGradePortal.Infrastructure.EntityFramework;

internal class DbContextHealthCheck<TContext>(
    TContext dbContext
) : IHealthCheck where TContext : DbContext
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            var database = dbContext.Database;

            await database.CanConnectAsync(cancellationToken);

            var pendingMigrations = await database.GetPendingMigrationsAsync(cancellationToken);

            if (pendingMigrations.Any())
            {
                throw new Exception("There are pending migrations that have not yet been applied!");
            }

            var appliedMigrations = await database.GetAppliedMigrationsAsync(cancellationToken);
            var allMigrations = database.GetMigrations();

            var data = new Dictionary<string, object>
            {
                { nameof(pendingMigrations), pendingMigrations },
                { nameof(appliedMigrations), appliedMigrations },
                { nameof(allMigrations), allMigrations }    
            };

            return HealthCheckResult.Healthy(data: data);
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("DbContext connection test failed", ex);
        }
    }
}