using Microsoft.Extensions.Logging;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Notification;
using UBBGradePortal.Application.Exceptions;
using UBBGradePortal.Application.Mappers;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationPublisher _notificationPublisher;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepository,
        IUserRepository userRepository,
        INotificationPublisher notificationPublisher,
        ILogger<NotificationService> logger
    )
    {
        _notificationRepository = notificationRepository;
        _userRepository = userRepository;
        _notificationPublisher = notificationPublisher;
        _logger = logger;
    }

    public async Task<List<NotificationDto>> GetForUser(Guid receiverId, CancellationToken cancellationToken)
    {
        var notifications = await _notificationRepository.GetForReceiver(receiverId, cancellationToken);

        return notifications
            .Select(NotificationMapper.FromNotificationToNotificationDto)
            .ToList();
    }

    public async Task<Guid> Add(AddNotificationDto addNotificationDto, CancellationToken cancellationToken)
    {
        var receiver = await _userRepository.GetById(addNotificationDto.ReceiverId, cancellationToken);

        if (receiver == null)
        {
            _logger.LogInformation("The receiver {ReceiverId} does not exist", addNotificationDto.ReceiverId);

            throw new NotFoundException("The receiver does not exist");
        }

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            Message = addNotificationDto.Message,
            CreatedOn = DateTime.UtcNow,
            IsRead = false,
            ReceiverId = receiver.Id,
        };

        var notificationId = await _notificationRepository.Add(notification, cancellationToken);

        await _notificationPublisher.PublishNotificationCreated(receiver.Id, notificationId, cancellationToken);

        return notificationId;
    }

    public async Task MarkAllAsRead(Guid receiverId, CancellationToken cancellationToken)
    {
        await _notificationRepository.MarkAllAsRead(receiverId, cancellationToken);
    }
}
