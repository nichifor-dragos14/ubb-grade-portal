namespace UBBGradePortal.Application.Abstractions;

public interface IUploadPresignService
{
    Task<(string Url, string Key)> PresignPutAsync(string filename, string contentType, string? userId, string? tenantId, CancellationToken cancellationToken);
    Task<string> PresignGetAsync(string key, CancellationToken cancellationToken);
    Task<string> PresignDeleteAsync(string key, CancellationToken cancellationToken);
}
