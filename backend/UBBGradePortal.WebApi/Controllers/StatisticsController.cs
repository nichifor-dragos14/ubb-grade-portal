using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Statistics;
using UBBGradePortal.Application.Exceptions;

namespace UBBGradePortal.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(
        IStatisticsService statisticsService
    )
    {
        _statisticsService = statisticsService;
    }

    /// <summary> Get general statistics for the logged student </summary>
    [HttpGet("student/general")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Results<Ok<StudentGeneralStatisticsDto>, BadRequest, ForbidHttpResult>> GetStudentGeneralStatistics(
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        var statistics = await _statisticsService.GetStudentGeneralStatistics(loggedUserId, cancellationToken);

        return TypedResults.Ok(statistics);
    }

    /// <summary> Get statistics for the selected course for a student </summary>
    [HttpGet("student/course/{courseId}")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<StudentCourseStatisticsDto>, BadRequest<string>, NotFound<string>, ForbidHttpResult>> GetStudentCourseStatistics(
        [FromRoute] Guid courseId,
        CancellationToken cancellationToken
    )
    {
        if (courseId == Guid.Empty)
        {
            return TypedResults.BadRequest("No course id was specified");
        }

        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        try
        {
            var statistics = await _statisticsService.GetStudentCourseStatistics(courseId, loggedUserId, cancellationToken);

            return TypedResults.Ok(statistics);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(ex.Message);
        }
        catch (ForbiddenException)
        {
            return TypedResults.Forbid();
        }
    }
}
