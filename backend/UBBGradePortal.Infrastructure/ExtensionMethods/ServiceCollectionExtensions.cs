using UBBGradePortal.Infrastructure.EntityFramework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Microsoft.Extensions.DependencyInjection;
using UBBGradePortal.Infrastructure.Microsoft;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.Repositories;

namespace UBBGradePortal.Infrastructure.ExtensionMethods;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddSingleton((serviceProvider) =>
        {
            var dataSourceBuilder = new NpgsqlDataSourceBuilder(configuration.GetConnectionString("Default"));
            dataSourceBuilder.EnableDynamicJson();

            return dataSourceBuilder.Build();
        });

        services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(configuration.GetConnectionString("Default")))
            .AddScoped(typeof(ILogger<>), typeof(MicrosoftLogger<>))
            .AddHostedService<EntityFramework.AutomaticMigrationsService>()
            .AddHealthChecks()
            .AddCheck<DbContextHealthCheck<ApplicationDbContext>>("Postgres:UBBGradePortal");

        services.AddScoped<IUserRepository, UserRepository>();

        return services;
    }
}