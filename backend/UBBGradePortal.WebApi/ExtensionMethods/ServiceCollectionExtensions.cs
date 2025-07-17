using NSwag.Generation.Processors.Security;
using UBBGradePortal.WebApi.Development;
using Vernou.Swashbuckle.HttpResultsAdapter;

namespace UBBGradePortal.WebApi.ExtensionMethods
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddWebApiServices(
            this IServiceCollection services,
            IConfiguration configuration,
            IWebHostEnvironment env)
        {
            // Add options

            // Add authentiocation

            services.AddControllers();

            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(c =>
            {
                c.OperationFilter<HttpResultsOperationFilter>();
                c.SchemaFilter<NonNullishAsRequiredSchemaFilter>();
                c.SupportNonNullableReferenceTypes();
            });

            services.AddOpenApiDocument();

            services.AddHealthChecks()
                    .AddElasticsearch(configuration["ElasticConfiguration:Uri"], "UBBGradePortal:Elasticsearch");

            if (env.IsDevelopment())
            {
                services.AddHostedService<SwaggerExportService>();
            }

            return services;
        }
    }
}
