using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using UBBGradePortal.WebApi.Auth;
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
            var jwtSection = configuration.GetSection("Jwt");
            var jwtKey = jwtSection.GetValue<string>("Key")
                              ?? throw new InvalidOperationException("Missing Jwt:Key");
            var jwtIssuer = jwtSection.GetValue<string>("Issuer")!;
            var jwtAudience = jwtSection.GetValue<string>("Audience")!;

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(o =>
                {
                    o.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidIssuer = jwtIssuer,
                        ValidAudience = jwtAudience,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ClockSkew = TimeSpan.FromMinutes(1),
                    };
                });

            services.AddAuthorization();

            services.AddScoped<TokenService>();

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
