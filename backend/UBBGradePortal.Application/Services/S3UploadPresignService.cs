using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.Options;

namespace UBBGradePortal.Application.Services;

public class S3UploadPresignService : IUploadPresignService
{
    private readonly IAmazonS3 _amazonS3;
    private readonly MinioConfigurationOptions _minioOptions;

    public S3UploadPresignService(
        IAmazonS3 amazonS3,
        IOptions<MinioConfigurationOptions> minioOptions
    )
    {
        _amazonS3 = amazonS3;
        _minioOptions = minioOptions.Value;
    }

    public Task<(string Url, string Key)> PresignPutAsync(
        string filename,
        string contentType,
        string? userId,
        string? tenantId,
        CancellationToken cancellationToken
    )
    {
        var extension = Path.GetExtension(filename);
        var key = $"tenant/{tenantId ?? "default"}/user/{userId ?? "anonymous"}/{DateTime.UtcNow:yyyy-MM}/{Guid.NewGuid()}{extension}";

        var presigned = new GetPreSignedUrlRequest
        {
            BucketName = _minioOptions.Bucket,
            Key = key,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddMinutes(Math.Max(1, _minioOptions.PresignMinutes)),
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType
        };

        var url = _amazonS3.GetPreSignedURL(presigned);
        url = ForceHttp(url);

        return Task.FromResult((url, key));
    }

    public Task<string> PresignGetAsync(string key, CancellationToken cancellationToken)
    {
        var presigned = new GetPreSignedUrlRequest
        {
            BucketName = _minioOptions.Bucket,
            Key = key,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.AddMinutes(Math.Max(1, _minioOptions.PresignMinutes))
        };

        var url = _amazonS3.GetPreSignedURL(presigned);
        url = ForceHttp(url);

        return Task.FromResult(url);
    }

    public Task<string> PresignDeleteAsync(string key, CancellationToken cancellationToken)
    {
        var presigned = new GetPreSignedUrlRequest
        {
            BucketName = _minioOptions.Bucket,
            Key = key,
            Verb = HttpVerb.DELETE,
            Expires = DateTime.UtcNow.AddMinutes(Math.Max(1, _minioOptions.PresignMinutes))
        };

        var url = _amazonS3.GetPreSignedURL(presigned);
        url = ForceHttp(url);

        return Task.FromResult(url);
    }

    private static string ForceHttp(string url)
    {
        if (url.StartsWith("https://localhost:9000", StringComparison.OrdinalIgnoreCase))
        {
            return url.Replace("https://", "http://");
        }

        return url;
    }
}
