using Microsoft.Extensions.DependencyInjection;

namespace UBBGradePortal.Domain.ExtensionMethods;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDomain(this IServiceCollection services)
    {
        return services;
    }
}
