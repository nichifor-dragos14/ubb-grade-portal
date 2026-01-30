namespace UBBGradePortal.Domain.Entities;

public class SolvedActivityDocument
{
    public Guid Id { get; set; }
    public string Bucket { get; set; } = "uploads";
    public string Key { get; set; } = string.Empty;
    public string OriginalName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long SizeBytes { get; set; }
    public string? Etag { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.Now;
    public bool IsDeleted { get; set; } = false;

    // The submission the document is linked to
    public Guid SolvedActivityId { get; set; }
    public SolvedActivity SolvedActivity { get; set; }
}
