using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Leaderboard;

namespace UBBGradePortal.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardsController : ControllerBase
{
    private readonly ILeaderboardService _leaderboardService;

    public LeaderboardsController(ILeaderboardService leaderboardService)
    {
        _leaderboardService = leaderboardService;
    }

    /// <summary> Get the top 10 students for this week (submissions) </summary>
    [HttpGet("student/weekly")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<Results<Ok<List<StudentLeaderboardEntryDto>>, ForbidHttpResult>> GetWeeklyStudentLeaderboard(
        CancellationToken cancellationToken
    )
    {
        var results = await _leaderboardService.GetWeeklyTopStudents(cancellationToken);

        return TypedResults.Ok(results);
    }

    /// <summary> Get the top 10 students for a month (submissions) </summary>
    [HttpGet("student/monthly")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<List<StudentLeaderboardEntryDto>>, BadRequest<string>, ForbidHttpResult>> GetMonthlyStudentLeaderboard(
        [FromQuery] int? month,
        [FromQuery] int? year,
        CancellationToken cancellationToken
    )
    {
        var now = DateTime.UtcNow;
        var targetMonth = month ?? now.Month;
        var targetYear = year ?? now.Year;

        if (targetMonth < 1 || targetMonth > 12)
        {
            return TypedResults.BadRequest("Invalid month");
        }

        var results = await _leaderboardService.GetMonthlyTopStudents(targetYear, targetMonth, cancellationToken);

        return TypedResults.Ok(results);
    }

    /// <summary> Get badges for the logged student </summary>
    [HttpGet("student/badges")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Results<Ok<List<BadgeDto>>, ForbidHttpResult>> GetStudentBadges(
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        var badges = await _leaderboardService.GetBadgesForStudent(loggedUserId, cancellationToken);

        return TypedResults.Ok(badges);
    }
}
