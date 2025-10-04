namespace UBBGradePortal.Domain.Entities
{
    public class ActivityDocument
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

        // The activity the document is linked to
        public Guid ActivityId { get; set; }
        public Activity Activity { get; set; }
    }
}
