using Microsoft.AspNet.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Activity;

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

    /// <summary> Get all activities. </summary>
    [HttpGet("course/{courseId}")]
    [Authorize(Roles = "Student,Professor,Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<List<ActivityDto>>, BadRequest<string>>> GetAllByCourseId(
        [FromRoute] Guid courseId,
        CancellationToken cancellationToken
    )
    {
        try
        {
            if (courseId == Guid.Empty)
            {
                return TypedResults.BadRequest("No course id was specified");
            }

            var activities = await _activityService.GetAllByCourseId(courseId, cancellationToken);

            return TypedResults.Ok(activities);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest(ex.Message.ToString());
        }
    }

    /// <summary> Get activity by id. </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Student,Professor,Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<ActivityDetailsDto>, BadRequest<string>, NotFound<string>>> GetActivityById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        if (id == Guid.Empty)
        {
            return TypedResults.BadRequest("No activity id was specified");
        }

        var activity = await _activityService.GetById(id, cancellationToken);

        return activity switch
        {
            null => TypedResults.NotFound("The activity was not found"),
            _ => TypedResults.Ok(activity),
        };
        ;
    }

    /// <summary> Add an activity. </summary>
    [HttpPost]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<string>, BadRequest<string>>> AddActivity(
        [FromBody] AddActivityDto activity,
        CancellationToken cancellationToken
    )
    {
        var loggedUserId = new Guid(User.Identity.GetUserId());
        var result = await _activityService.Add(activity, loggedUserId, cancellationToken);

        return result switch
        {
            false => TypedResults.BadRequest("Could not create activity"),
            _ => TypedResults.Ok("Succesfully created activity"),
        };
    }

    /// <summary> Update an activity. </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<string>, BadRequest<string>>> UpdateActivity(
        [FromBody] UpdateActivityDto activity,
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        var loggedUserId = new Guid(User.Identity.GetUserId());
        var result = await _activityService.Update(activity, id, loggedUserId, cancellationToken);

        return result switch
        {
            false => TypedResults.BadRequest("Could not update activity"),
            _ => TypedResults.Ok("Succesfully created activity"),
        };
    }

    /// <summary> Add a document for an activity. </summary>
    [HttpPost("{id}/document")]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<string>, BadRequest<string>>> AddActivityDocument(
        [FromBody] AddActivityDocumentDto activityDocument,
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        var loggedUserId = new Guid(User.Identity.GetUserId());
        var result = await _activityService.AddDocument(activityDocument, id, loggedUserId, cancellationToken);

        return result switch
        {
            false => TypedResults.BadRequest("Could not add document to the activity"),
            _ => TypedResults.Ok("Succesfully added document to the activity"),
        };
    }
}
