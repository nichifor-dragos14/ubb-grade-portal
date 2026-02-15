using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Notification;

namespace UBBGradePortal.WebApi.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    /// <summary> Get all notifications for the logged in user </summary>
    [HttpGet]
    [Authorize(Roles = "Student,Professor,Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<Results<Ok<List<NotificationDto>>, ForbidHttpResult>> GetNotifications(
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        var notifications = await _notificationService.GetForUser(loggedUserId, cancellationToken);

        return TypedResults.Ok(notifications);
    }

    /// <summary> Mark all notifications as read for the logged in user </summary>
    [HttpPut("read-all")]
    [Authorize(Roles = "Student,Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<Results<Ok, ForbidHttpResult>> MarkAllAsRead(
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        await _notificationService.MarkAllAsRead(loggedUserId, cancellationToken);

        return TypedResults.Ok();
    }
}
