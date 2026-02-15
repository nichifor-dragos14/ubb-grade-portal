using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;

namespace UBBGradePortal.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<NotificationRepository> _logger;

    public NotificationRepository(
        ApplicationDbContext dbContext,
        ILogger<NotificationRepository> logger
    )
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<List<Notification>> GetForReceiver(Guid receiverId, CancellationToken cancellationToken)
    {
        return await _dbContext
            .Notifications
            .AsNoTracking()
            .Where(notification => notification.ReceiverId == receiverId)
            .OrderByDescending(notification => notification.CreatedOn)
            .ToListAsync(cancellationToken);
    }

    public async Task<Guid> Add(Notification notification, CancellationToken cancellationToken)
    {
        await _dbContext.Notifications.AddAsync(notification, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return notification.Id;
    }

    public async Task MarkAllAsRead(Guid receiverId, CancellationToken cancellationToken)
    {
        var notifications = await _dbContext
            .Notifications
            .Where(notification => notification.ReceiverId == receiverId && !notification.IsRead)
            .ToListAsync(cancellationToken);

        if (notifications.Count == 0)
        {
            return;
        }

        var readOn = DateTime.UtcNow;

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadOn = readOn;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
