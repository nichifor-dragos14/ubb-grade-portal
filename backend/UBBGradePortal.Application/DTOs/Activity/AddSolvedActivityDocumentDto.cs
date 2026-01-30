namespace UBBGradePortal.Application.DTOs.Activity;

public record AddSolvedActivityDocumentDto(
    string Key,
    string OriginalName,
    string ContentType,
    long SizeBytes,
    string Bucket,
    string? Etag
);
