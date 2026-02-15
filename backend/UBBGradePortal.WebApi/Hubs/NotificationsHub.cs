using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace UBBGradePortal.WebApi.Hubs;

[Authorize(Roles = "Student,Professor,Admin")]
public class NotificationsHub : Hub
{
}
