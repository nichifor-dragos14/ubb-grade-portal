using UBBGradePortal.Application.DTOs.Document;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Mappers;

public static class DocumentMapper
{
    public static DocumentDto FromSolvedActivityDocumentToDocumentDto(
       SolvedActivityDocument solvedActivityDocument
    )
    {
        return new DocumentDto
        {
            Id = solvedActivityDocument.Id,
            OriginalName = solvedActivityDocument.OriginalName,
            ContentType = solvedActivityDocument.ContentType,
            SizeBytes = solvedActivityDocument.SizeBytes,
            CreatedOn = solvedActivityDocument.CreatedOn,
            Key = solvedActivityDocument.Key,
            Bucket = solvedActivityDocument.Bucket
        };
    }

    public static DocumentDto FromActivityDocumentToDocumentDto(
       ActivityDocument solvedActivityDocument
    )
    {
        return new DocumentDto
        {
            Id = solvedActivityDocument.Id,
            OriginalName = solvedActivityDocument.OriginalName,
            ContentType = solvedActivityDocument.ContentType,
            SizeBytes = solvedActivityDocument.SizeBytes,
            CreatedOn = solvedActivityDocument.CreatedOn,
            Key = solvedActivityDocument.Key,
            Bucket = solvedActivityDocument.Bucket
        };
    }
}
