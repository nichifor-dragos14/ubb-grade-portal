namespace UBBGradePortal.Domain.Entities;

public class Badge
{
    public Guid Id { get; set; }
    public DateTime CreatedOn { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public int Month { get; set; }
    public string Message { get; set; } = string.Empty;
    public int Position { get; set; }
}
