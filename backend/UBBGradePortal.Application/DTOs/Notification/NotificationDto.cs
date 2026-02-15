namespace UBBGradePortal.Application.DTOs.Notification;

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; }
    public bool IsRead { get; set; }
}
