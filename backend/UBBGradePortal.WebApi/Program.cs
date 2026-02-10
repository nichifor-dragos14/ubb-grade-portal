using Microsoft.AspNetCore.Identity;
using UBBGradePortal.Application.ExtensionMethods;
using UBBGradePortal.Application.Options;
using UBBGradePortal.Domain.ExtensionMethods;
using UBBGradePortal.Infrastructure.Auth;
using UBBGradePortal.Infrastructure.ExtensionMethods;
using UBBGradePortal.WebApi.ExtensionMethods;

var builder = WebApplication.CreateBuilder(args)
                         .ConfigureSerilog();

builder.Services.Configure<MinioConfigurationOptions>(builder.Configuration.GetSection("Minio"));
builder.Services.Configure<OpenAiOptions>(builder.Configuration.GetSection("OpenAi"));

builder.Services
       .AddDomain()
       .AddApplication()
       .AddInfrastructure(builder.Configuration)
       .AddWebApiServices(builder.Configuration, builder.Environment);

var app = builder
    .Build()
    .UseWebApiPipeline();

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

    foreach (var name in new[] { "Student", "Professor", "Admin" })
    {
        if (!await roleManager.RoleExistsAsync(name))
        {
            await roleManager.CreateAsync(
                new ApplicationRole 
                { 
                    Name = name,
                    NormalizedName = name.ToUpperInvariant() 
                }
            );
        }
    }       
}

app.Run();