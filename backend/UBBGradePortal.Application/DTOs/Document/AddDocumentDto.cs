namespace UBBGradePortal.Application.DTOs.Document;

public record AddDocumentDto(
    string Key,
    string OriginalName,
    string ContentType,
    long SizeBytes,
    string Bucket,
    string? Etag
);
