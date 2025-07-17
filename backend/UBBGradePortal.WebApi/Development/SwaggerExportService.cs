using Microsoft.OpenApi.Writers;
using Swashbuckle.AspNetCore.Swagger;

namespace UBBGradePortal.WebApi.Development;

public class SwaggerExportService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;

    public SwaggerExportService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;

        HotReloadManager.SwaggerExportService = this;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var serviceProvider = scope.ServiceProvider;

        var env = serviceProvider.GetRequiredService<IWebHostEnvironment>();
        var provider = scope.ServiceProvider.GetRequiredService<ISwaggerProvider>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<SwaggerExportService>>();

        var swagger = provider.GetSwagger("v1");
        var path = "Unknown";

        try
        {
            var repositoryRootPath = env.ContentRootPath.Split("\\backend\\")[0];
            path = Path.Combine(repositoryRootPath, "codegen", "backend-services", "backend.swagger.json");

            logger.LogInformation("Writing swagger file: ({path})", path);

            File.Delete(path);

            await using var fileStream = File.OpenWrite(path);
            await using var streamWriter = new StreamWriter(fileStream);

            var openApiJsonWriter = new OpenApiJsonWriter(streamWriter);

            swagger.SerializeAsV3(openApiJsonWriter);
        }
        catch (Exception _)
        {
            logger.LogWarning("Writing swagger file: ({path})", path);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}