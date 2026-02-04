using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Application.DTOs.Document;
using UBBGradePortal.Application.DTOs.SolvedActivity;
using UBBGradePortal.Application.Exceptions;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActivityController : ControllerBase
{
    private readonly IActivityService _activityService;

    public ActivityController(
        IActivityService activityService
    )
    {
        _activityService = activityService;
    }

    /// <summary> Get all activities </summary>
    [HttpGet("course/{courseId}")]
    [Authorize(Roles = "Student,Professor,Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<List<ActivityDto>>, NotFound<string>, BadRequest<string>>> GetAllByCourseId(
        [FromRoute] Guid courseId,
        CancellationToken cancellationToken
    )
    {
        if (courseId == Guid.Empty)
        {
            return TypedResults.BadRequest("No course id was specified");
        }

        try
        {
            var activities = await _activityService.GetAllByCourseId(courseId, cancellationToken);

            return TypedResults.Ok(activities);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(ex.Message);
        }
    }

    /// <summary> Get activity by id </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Student,Professor,Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<ActivityDto>, NotFound<string>, BadRequest<string>>> GetActivityById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        if (id == Guid.Empty)
        {
            return TypedResults.BadRequest("No activity id was specified");
        }

        try
        {
            var activity = await _activityService.GetById(id, cancellationToken);

            return TypedResults.Ok(activity);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(ex.Message);
        }
    }

    /// <summary> Add an activity </summary>
    [HttpPost]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<Guid>, NotFound<string>, ForbidHttpResult>> AddActivity(
        [FromBody] AddActivityDto addActivityDto,
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        try
        {
            var activityId = await _activityService.Add(addActivityDto, loggedUserId, cancellationToken);

            return TypedResults.Ok(activityId);
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

    /// <summary> Update an activity. </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<Guid>, NotFound<string>, ForbidHttpResult>> UpdateActivity(
        [FromBody] UpdateActivityDto updateActivityDto,
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        try
        {
            var activityId = await _activityService.Update(updateActivityDto, id, loggedUserId, cancellationToken);

            return TypedResults.Ok(activityId);
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

    /// <summary> Add a document for an activity. </summary>
    [HttpPost("{id}/document")]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<Guid>, NotFound<string>, ForbidHttpResult>> AddActivityDocument(
        [FromBody] AddDocumentDto addDocumentDto,
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        try
        {
            var documentId = await _activityService.AddDocument(addDocumentDto, id, loggedUserId, cancellationToken);

            return TypedResults.Ok(documentId);
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

    /// <summary> Delete a document from an activity. </summary>
    [HttpDelete("document/{id}")]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok, NotFound<string>, ForbidHttpResult>> DeleteActivityDocument(
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        try
        {
            await _activityService.DeleteDocument(id, loggedUserId, cancellationToken);

            return TypedResults.Ok();
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
