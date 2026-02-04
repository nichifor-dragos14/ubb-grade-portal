using Amazon.S3;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.Options;
using UBBGradePortal.Application.Services;

namespace UBBGradePortal.Application.ExtensionMethods;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton<IAmazonS3>(serviceProvider =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<MinioConfigurationOptions>>().Value;
            var s3Configuration = new AmazonS3Config
            {
                ServiceURL = $"http{(options.UseSsl ? "s" : "")}://{options.Endpoint}:{options.Port}",
                ForcePathStyle = true,
                UseHttp = !options.UseSsl
            };
            return new AmazonS3Client(options.AccessKey, options.SecretKey, s3Configuration);
        });

        services.AddScoped<IUploadPresignService, S3UploadPresignService>();

        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ICourseService, CourseService>();
        services.AddScoped<IActivityService, ActivityService>();
        services.AddScoped<ISolvedActivityService, SolvedActivityService>();

        return services;
    }
}
