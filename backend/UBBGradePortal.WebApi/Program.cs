
using UBBGradePortal.Domain.ExtensionMethods;
using UBBGradePortal.WebApi.ExtensionMethods;
using UBBGradePortal.Infrastructure.ExtensionMethods;
using UBBGradePortal.Application.ExtensionMethods;

var builder = WebApplication.CreateBuilder(args)
                         .ConfigureSerilog();

builder.Services
       .AddDomain()
       .AddApplication()
       .AddInfrastructure(builder.Configuration)
       .AddWebApiServices(builder.Configuration, builder.Environment);

var app = builder
    .Build()
    .UseWebApiPipeline();

app.Run();