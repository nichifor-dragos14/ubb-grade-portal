using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Course;
using UBBGradePortal.Application.DTOs.CourseDomain;
using UBBGradePortal.Application.DTOs.Pagination;
using UBBGradePortal.Application.Exceptions;

namespace UBBGradePortal.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CourseController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CourseController(
        ICourseService courseService
    )
    {
        _courseService = courseService;
    }

    /// <summary> Get all courses </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<List<CourseDto>>, BadRequest>> GetAllCoursesByDomainIds(
        [FromQuery] List<Guid> courseDomainIds,
        CancellationToken cancellationToken
    )
    {
        var courses = await _courseService.GetAllByCourseDomainIds(courseDomainIds, cancellationToken);

        return TypedResults.Ok(courses);
    }

    /// <summary> Get all course domains </summary>
    [HttpGet("domains")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<List<CourseDomainDto>>, BadRequest>> GetAllCourseDomains(
        CancellationToken cancellationToken
    )
    {
        var courseDomains = await _courseService.GetAllCourseDomains(cancellationToken);

        return TypedResults.Ok(courseDomains);
    }

    /// <summary> Get all the courses created by professor </summary>
    [HttpGet("created")]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Results<Ok<PaginatedProfessorCreatedCourseDto>, BadRequest, ForbidHttpResult>> GetAllProfessorCreated(
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

        var paginatedResponse = await _courseService.GetAllProfessorCreated(pageNumber, pageSize, loggedUserId, cancellationToken);

        return TypedResults.Ok(paginatedResponse);
    }

    /// <summary> Get all course enrollments of a student </summary>
    [HttpGet("enrollments")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Results<Ok<PaginatedStudentCourseEnrollmentDto>, BadRequest, ForbidHttpResult>> GetAllStudentCourseEnrollments(
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

        var paginatedResponse = await _courseService.GetAllStudentCourseEnrollments(pageNumber, pageSize, loggedUserId, cancellationToken);

        return TypedResults.Ok(paginatedResponse);
    }

    /// <summary> Get all the recommended courses or get all courses by course domain name / course name search string</summary>
    [HttpGet("find")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Results<Ok<List<CourseDto>>, BadRequest, ForbidHttpResult>> GetAllProfessorCreated(
        [FromQuery] string? searchString,
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        var courses = await _courseService.GetAllStudentCoursesByRecommendationOrSearchString(searchString, loggedUserId, cancellationToken);

        return TypedResults.Ok(courses);
    }

    /// <summary> Get course by id </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Professor,Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<CourseDto>, BadRequest<string>, NotFound<string>>> GetCourseById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        if (id == Guid.Empty)
        {
            return TypedResults.BadRequest("No course id was specified");
        }

        try
        {
            var course = await _courseService.GetById(id, cancellationToken);

            return TypedResults.Ok(course);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(ex.Message);
        }
    }

    /// <summary> Get course by id with student activities information</summary>
    [HttpGet("{id}/student")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Results<Ok<CourseDto>, BadRequest<string>, NotFound<string>, ForbidHttpResult>> GetCourseByIdStudent(
        [FromRoute] Guid id,
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        if (id == Guid.Empty)
        {
            return TypedResults.BadRequest("No course id was specified");
        }

        try
        {
            var course = await _courseService.GetByIdStudent(id, loggedUserId, cancellationToken);

            return TypedResults.Ok(course);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(ex.Message);
        }
    }

    /// <summary> Add a course </summary>
    [HttpPost]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<Guid>, NotFound<string>, ForbidHttpResult>> AddCourse(
        [FromBody] AddCourseDto course,
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
            var courseId = await _courseService.Add(course, loggedUserId, cancellationToken);

            return TypedResults.Ok(courseId);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(ex.Message);
        }
    }

    /// <summary> Update a course </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Professor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<Guid>, NotFound<string>, ForbidHttpResult, BadRequest<string>>> UpdateCourse(
        [FromRoute] Guid id,
        [FromBody] UpdateCourseDto course,
        CancellationToken cancellationToken
    )
    {
        var loggedUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(loggedUserIdValue, out var loggedUserId))
        {
            return TypedResults.Forbid();
        }

        if (id == Guid.Empty)
        {
            return TypedResults.BadRequest("No course id was specified");
        }

        try
        {
            var courseId = await _courseService.Update(course, id, loggedUserId, cancellationToken);

            return TypedResults.Ok(courseId);
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
