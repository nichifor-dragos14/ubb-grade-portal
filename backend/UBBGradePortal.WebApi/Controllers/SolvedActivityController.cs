using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Pagination;
using UBBGradePortal.Application.DTOs.SolvedActivity;
using UBBGradePortal.Application.Exceptions;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SolvedActivityController : ControllerBase
    {
        private readonly ISolvedActivityService _solvedActivityService;

        public SolvedActivityController(
            ISolvedActivityService solvedActivityService
        )
        {
            _solvedActivityService = solvedActivityService;
        }

        /// <summary> Get all solved activities for all the courses created by a professor </summary>
        [HttpGet("professor")]
        [Authorize(Roles = "Professor")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<Results<Ok<PaginatedProfessorSolvedActivityDto>, BadRequest, ForbidHttpResult>> GetAllByStatusForProfessorCourses(
            [FromQuery] SolvedActivityStatusFilter status,
            [FromQuery] string? studentName,
            [FromQuery] Guid? courseId,
            [FromQuery] int pageNumber,
            [FromQuery] int pageSize,
            CancellationToken cancellationToken
        )
        {
            var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
            {
                return TypedResults.Forbid();
            }

            var paginatedResponse = await _solvedActivityService.GetAllByStatusForProfessorCourses(pageNumber, pageSize, status, studentName, courseId, loggedUserId, cancellationToken);

            return TypedResults.Ok(paginatedResponse);
        }

        /// <summary> Get solved activity by id </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Professor")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<Results<Ok<SolvedActivityDto>, BadRequest, ForbidHttpResult>> GetSolvedActivityByIdForProfessor(
            [FromRoute] Guid id,
            CancellationToken cancellationToken
        )
        {
            var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
            {
                return TypedResults.Forbid();
            }

            var solvedActivity = await _solvedActivityService.GetById(id, loggedUserId, cancellationToken);

            return TypedResults.Ok(solvedActivity);
        }

        /// <summary> Get an activity last submission from user (solved activity) by activity id </summary>
        [HttpGet("{activityId}/last")]
        [Authorize(Roles = "Student")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<Results<Ok<SolvedActivityDto>, NotFound<string>, BadRequest<string>, ForbidHttpResult>> GetLastByActivityId(
            [FromRoute] Guid activityId,
            CancellationToken cancellationToken
        )
        {
            if (activityId == Guid.Empty)
            {
                return TypedResults.BadRequest("No activity id was specified");
            }

            var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
            {
                return TypedResults.Forbid();
            }

            try
            {
                var activity = await _solvedActivityService.GetLastByActivityId(activityId, loggedUserId, cancellationToken);

                return TypedResults.Ok(activity);
            }
            catch (NotFoundException ex)
            {
                return TypedResults.NotFound(ex.Message);
            }
        }

        /// <summary> Add an activity submission (solved activity) </summary>
        [HttpPost]
        [Authorize(Roles = "Student")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<Results<Ok<Guid>, NotFound<string>, ForbidHttpResult>> AddSolvedActivity(
            [FromBody] AddSolvedActivityDto addSolvedActivityDto,
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
                var solvedActivityId = await _solvedActivityService.Add(addSolvedActivityDto, loggedUserId, cancellationToken);

                return TypedResults.Ok(solvedActivityId);
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

        /// <summary> Update an activity submission (solved activity) </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Student")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<Results<Ok<Guid>, NotFound<string>, ForbidHttpResult>> UpdateSolvedActivity(
            [FromBody] UpdateSolvedActivityDto updateSolvedActivityDto,
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
                var solvedActivityId = await _solvedActivityService.Update(updateSolvedActivityDto, id, loggedUserId, cancellationToken);

                return TypedResults.Ok(solvedActivityId);
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

        /// <summary> Update an activity submission (solved activity) </summary>
        [HttpPut("{id}/evaluate")]
        [Authorize(Roles = "Professor")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<Results<Ok<Guid>, NotFound<string>, ForbidHttpResult>> GradeSolvedActivityDto(
            [FromBody] GradeSolvedActivityDto gradeSolvedActivityDto,
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
                var solvedActivityId = await _solvedActivityService.GradeSolvedActivity(gradeSolvedActivityDto, id, loggedUserId, cancellationToken);

                return TypedResults.Ok(solvedActivityId);
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

        /// <summary> Delete a document from a submission (solved activity). </summary>
        [HttpDelete("document/{id}")]
        [Authorize(Roles = "Student")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<Results<Ok, NotFound<string>, ForbidHttpResult>> DeleteSolvedActivityDocument(
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
                await _solvedActivityService.DeleteDocument(id, loggedUserId, cancellationToken);

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
}
