using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.Auth;
using UBBGradePortal.Infrastructure.EntityFramework;
using UBBGradePortal.Infrastructure.Microsoft;
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

        services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(configuration.GetConnectionString("Default")));

        services
            .AddIdentityCore<ApplicationUser>(opts =>
            {
                opts.User.RequireUniqueEmail = true;

                opts.Password.RequireDigit = true;
                opts.Password.RequireLowercase = true;
                opts.Password.RequireUppercase = false;
                opts.Password.RequireNonAlphanumeric = false;
                opts.Password.RequiredLength = 8;

                opts.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                opts.Lockout.MaxFailedAccessAttempts = 5;
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>();

        services
            .AddScoped(typeof(ILogger<>), typeof(MicrosoftLogger<>))
            .AddHostedService<AutomaticMigrationsService>()
            .AddHealthChecks()
            .AddCheck<DbContextHealthCheck<ApplicationDbContext>>("Postgres:UBBGradePortal");

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<ICourseDomainRepository, CourseDomainRepository>();
        services.AddScoped<ICourseEnrollmentRepository, CourseEnrollmentRepository>();
        services.AddScoped<IActivityRepository, ActivityRepository>();
        services.AddScoped<ISolvedActivityRepository, SolvedActivityRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();

        return services;
    }
}