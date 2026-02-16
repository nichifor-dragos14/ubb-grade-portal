using System.Security.Claims;
using UBBGradePortal.Application.Abstractions;

namespace UBBGradePortal.WebApi.Middleware;

internal sealed class BannedUserMiddleware
{
    private readonly RequestDelegate _next;

    public BannedUserMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IUserService userService)
    {
        if (context.User?.Identity?.IsAuthenticated == true)
        {
            var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? context.User.FindFirstValue("sub");

            if (Guid.TryParse(userIdValue, out var userId))
            {
                var user = await userService.GetById(userId, context.RequestAborted);

                if (user is not null && user.IsBanned)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsync("This account is banned.");
                    return;
                }
            }
        }

        await _next(context);
    }
}
