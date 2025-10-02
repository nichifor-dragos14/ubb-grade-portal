namespace UBBGradePortal.Application.Options;

public sealed class MinioConfigurationOptions
{
    public string Endpoint { get; init; } = string.Empty;
    public int Port { get; init; }
    public bool UseSsl { get; init; }
    public string AccessKey { get; init; } = string.Empty;
    public string SecretKey { get; init; } = string.Empty;
    public string Bucket { get; init; } = string.Empty;
    public int PresignMinutes { get; init; }
}