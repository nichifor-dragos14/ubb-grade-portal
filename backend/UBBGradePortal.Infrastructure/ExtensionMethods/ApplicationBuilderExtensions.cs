using Microsoft.AspNetCore.Builder;

namespace UBBGradePortal.Infrastructure.ExtensionMethods;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseInfrastructure(this IApplicationBuilder app)
    {
        return app;
    }
}