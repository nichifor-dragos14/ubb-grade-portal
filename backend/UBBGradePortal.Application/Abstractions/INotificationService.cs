using UBBGradePortal.Application.DTOs.Notification;

namespace UBBGradePortal.Application.Abstractions;

public interface INotificationService
{
    Task<List<NotificationDto>> GetForUser(Guid receiverId, CancellationToken cancellationToken);
    Task<Guid> Add(AddNotificationDto addNotificationDto, CancellationToken cancellationToken);
    Task MarkAllAsRead(Guid receiverId, CancellationToken cancellationToken);
}
