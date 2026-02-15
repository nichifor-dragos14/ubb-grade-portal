namespace UBBGradePortal.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadOn { get; set; }

    public Guid? CourseId { get; set; }
    public Guid? ActivityId { get; set; }

    public Guid ReceiverId { get; set; }
    public User Receiver { get; set; } = null!;
}
