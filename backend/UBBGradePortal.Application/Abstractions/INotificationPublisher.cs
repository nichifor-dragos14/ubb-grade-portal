namespace UBBGradePortal.Application.Abstractions;

public interface INotificationPublisher
{
    Task PublishNotificationCreated(Guid receiverId, Guid notificationId, CancellationToken cancellationToken);
}
