namespace UBBGradePortal.Application.DTOs.Document;

public class DocumentDto
{
    public Guid Id { get; set; }
    public string OriginalName { get; set; }
    public string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public DateTime CreatedOn { get; set; }
    public string Key { get; set; }
    public string Bucket { get; set; }
}
