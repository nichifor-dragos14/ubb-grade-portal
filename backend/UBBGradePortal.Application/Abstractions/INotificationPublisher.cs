namespace UBBGradePortal.Application.Abstractions;

public interface INotificationPublisher
{
    Task PublishNotificationCreated(Guid receiverId, Guid notificationId, CancellationToken cancellationToken);
    Task PublishSubmissionCreated(Guid receiverId, Guid solvedActivityId, CancellationToken cancellationToken);
}
