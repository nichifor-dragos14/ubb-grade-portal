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

            var elasticSearchUri = context.Configuration["ElasticConfiguration:Uri"];
            var assemblyName = Assembly.GetExecutingAssembly().GetName().Name;

            if (elasticSearchUri is null || assemblyName is null)
            {
                return;
            }

            var elasticSearchIndexFormat = $"{assemblyName.ToLower().Replace(".", "-")}-{environment.ToLower()}-{DateTime.UtcNow:yyyy-MM}";

            configuration.Enrich.FromLogContext()
                .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri(elasticSearchUri))
                {
                    AutoRegisterTemplate = true,
                    IndexFormat = elasticSearchIndexFormat,
                    NumberOfReplicas = 1,
                    NumberOfShards = 2
                })
                .Enrich.WithProperty("Environment", environment)
                .ReadFrom.Configuration(context.Configuration);
        });

        return builder;
    }
}