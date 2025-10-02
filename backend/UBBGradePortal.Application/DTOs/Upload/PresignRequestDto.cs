namespace UBBGradePortal.Application.DTOs.Upload;

public record PresignRequestDto(
    string Filename,
    string TenantId,
    string ContentType = "application/octet-stream"
);
