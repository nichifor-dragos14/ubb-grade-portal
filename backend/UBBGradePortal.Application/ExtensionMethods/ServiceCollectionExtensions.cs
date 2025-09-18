using Microsoft.Extensions.DependencyInjection;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.Services;

namespace UBBGradePortal.Application.ExtensionMethods;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ICourseService, CourseService>();

        return services;
    }
}
