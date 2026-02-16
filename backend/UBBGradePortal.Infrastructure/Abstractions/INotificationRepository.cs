using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface INotificationRepository
{
    Task<List<Notification>> GetForReceiver(Guid receiverId, CancellationToken cancellationToken);
    Task<Guid> Add(Notification notification, CancellationToken cancellationToken);
    Task MarkAsRead(Guid receiverId, Guid notificationId, CancellationToken cancellationToken);
    Task MarkAllAsRead(Guid receiverId, CancellationToken cancellationToken);
}
