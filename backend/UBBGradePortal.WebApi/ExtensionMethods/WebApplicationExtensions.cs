using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using UBBGradePortal.WebApi.Hubs;

namespace UBBGradePortal.WebApi.ExtensionMethods;

public static class WebApplicationExtensions
{
    public static WebApplication UseWebApiPipeline(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();
        app.UseRouting();

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseHealthChecks("/healthy");
        app.MapHealthChecks("/health-details", new HealthCheckOptions
        {
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        });

        app.MapControllers();
        app.MapHub<NotificationsHub>("/hubs/notifications");

        return app;
    }
}