using UBBGradePortal.Application.DTOs.Notification;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Mappers;

public static class NotificationMapper
{
    public static NotificationDto FromNotificationToNotificationDto(Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            Message = notification.Message,
            CreatedOn = notification.CreatedOn,
            IsRead = notification.IsRead,
        };
    }
}
