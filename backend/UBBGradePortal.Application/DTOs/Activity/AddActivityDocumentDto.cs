namespace UBBGradePortal.Application.DTOs.Activity;

public record AddActivityDocumentDto(
    string Key,
    string OriginalName,
    string ContentType,
    long SizeBytes,
    string Bucket,
    string? Etag
);