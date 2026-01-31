namespace UBBGradePortal.Application.DTOs.Activity;

public record SolvedActivityDocumentDto(
    Guid Id,
    string OriginalName,
    string ContentType,
    long SizeBytes,
    DateTime CreatedOn,
    string Key,
    string Bucket
);
