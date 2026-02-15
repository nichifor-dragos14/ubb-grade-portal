namespace UBBGradePortal.Application.DTOs.Notification;

public record AddNotificationDto(
    Guid ReceiverId,
    string Message,
    Guid? CourseId,
    Guid? ActivityId
);
