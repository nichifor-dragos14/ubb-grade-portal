namespace UBBGradePortal.Application.DTOs.Document;

public record DocumentDto(
    Guid Id,
    string OriginalName,
    string ContentType,
    long SizeBytes,
    DateTime CreatedOn,
    string Key,
    string Bucket
);
