using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Course;

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

    /// <summary> Get all courses. </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<Results<Ok<List<CourseDto>>, BadRequest>> GetAllCoursesByDomainIds(
        [FromQuery] List<Guid> courseDomainIds,
        CancellationToken cancellationToken
    )
    {
        var courses = await _courseService.GetAllByCourseDomainIds(courseDomainIds, cancellationToken);

        return TypedResults.Ok(courses);
    }

    /// <summary> Get all course domains. </summary>
    [HttpGet("domains")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<Results<Ok<List<CourseDomainDto>>, BadRequest>> GetAllCourseDomains(CancellationToken cancellationToken)
    {
        var courseDomains = await _courseService.GetAllCourseDomains(cancellationToken);

        return TypedResults.Ok(courseDomains);
    }
}
