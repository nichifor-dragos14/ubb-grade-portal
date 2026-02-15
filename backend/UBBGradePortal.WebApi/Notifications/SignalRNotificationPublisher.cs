using Microsoft.AspNetCore.SignalR;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.WebApi.Hubs;

namespace UBBGradePortal.WebApi.Notifications;

public class SignalRNotificationPublisher : INotificationPublisher
{
    private readonly IHubContext<NotificationsHub> _hubContext;

    public SignalRNotificationPublisher(IHubContext<NotificationsHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task PublishNotificationCreated(Guid receiverId, Guid notificationId, CancellationToken cancellationToken)
    {
        return _hubContext.Clients
            .User(receiverId.ToString())
            .SendAsync("notificationCreated", new { notificationId }, cancellationToken);
    }
}
