namespace UBBGradePortal.Application.DTOs.Activity;

public record ActivityDocumentDto(
    Guid Id,
    string OriginalName,
    string ContentType,
    long SizeBytes,
    DateTime CreatedOn,
    string Key,
    string Bucket
);
