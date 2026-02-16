using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.WebApi.Auth;
using UBBGradePortal.WebApi.Development;
using UBBGradePortal.WebApi.Jobs;
using UBBGradePortal.WebApi.Notifications;
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

                    o.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;

                            if (!string.IsNullOrWhiteSpace(accessToken) &&
                                path.StartsWithSegments("/hubs/notifications"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };
                });

            services.AddAuthorization();

            services.AddScoped<TokenService>();
            services.AddScoped<INotificationPublisher, SignalRNotificationPublisher>();
            services.AddHostedService<MonthlyBadgeJob>();

            services.AddControllers();
            services.AddSignalR();

            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(c =>
            {
                c.OperationFilter<HttpResultsOperationFilter>();
                c.SchemaFilter<NonNullishAsRequiredSchemaFilter>();
                c.SupportNonNullableReferenceTypes();

                var securityScheme = new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT"
                };

                c.AddSecurityDefinition("Bearer", securityScheme);
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            services.AddOpenApiDocument();

            var elasticSearchUri = configuration["ElasticConfiguration:Uri"];

            if (elasticSearchUri is not null)
            {
                services.AddHealthChecks()
                   .AddElasticsearch(elasticSearchUri, "UBBGradePortal:Elasticsearch");
            }
           
            if (env.IsDevelopment())
            {
                services.AddHostedService<SwaggerExportService>();
            }

            return services;
        }
    }
}
