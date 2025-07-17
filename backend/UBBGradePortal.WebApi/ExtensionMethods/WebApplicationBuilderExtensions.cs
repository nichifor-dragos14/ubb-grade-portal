using Serilog;
using Serilog.Sinks.Elasticsearch;
using System.Reflection;

namespace UBBGradePortal.WebApi.ExtensionMethods;

public static class WebApplicationBuilderExtensions
{
    public static WebApplicationBuilder ConfigureSerilog(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((context, configuration) =>
        {
            var environment = context.HostingEnvironment.EnvironmentName;

            configuration.Enrich.FromLogContext()
                .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri(context.Configuration["ElasticConfiguration:Uri"]))
                {
                    AutoRegisterTemplate = true,
                    IndexFormat =
                        $"{Assembly.GetExecutingAssembly().GetName().Name.ToLower().Replace(".", "-")}-{environment.ToLower()}-{DateTime.UtcNow:yyyy-MM}",
                    NumberOfReplicas = 1,
                    NumberOfShards = 2
                })
                .Enrich.WithProperty("Environment", environment)
                .ReadFrom.Configuration(context.Configuration);
        });

        return builder;
    }
}