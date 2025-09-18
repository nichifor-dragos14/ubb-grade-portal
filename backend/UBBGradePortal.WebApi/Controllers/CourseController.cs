using Microsoft.AspNetCore.Mvc;
using UBBGradePortal.Application.Abstractions;

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
    public async Task<IActionResult> GetAllCourses(CancellationToken cancellationToken)
    {
        var courses = await _courseService.GetAll(cancellationToken);

        return Ok(courses);
    }

    /// <summary> Get all course domains. </summary>
    [HttpGet("domains")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllCourseDomains(CancellationToken cancellationToken)
    {
        var courseDomains = await _courseService.GetAllCourseDomains(cancellationToken);

        return Ok(courseDomains);
    }
}
