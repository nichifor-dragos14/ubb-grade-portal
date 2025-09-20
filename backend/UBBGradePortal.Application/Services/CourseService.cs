using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Course;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.Microsoft;

namespace UBBGradePortal.Application.Services;

public class CourseService : ICourseService
{
    private readonly ICourseRepository _courseRepository;
    private readonly ICourseDomainRepository _courseDomainRepository;
    private readonly ILogger<CourseService> _logger;
    
    public CourseService(
        ICourseRepository courseRepository,
        ICourseDomainRepository courseDomainRepository,
        ILogger<CourseService> logger
    )
    {
        _courseRepository = courseRepository;
        _courseDomainRepository = courseDomainRepository;
        _logger = logger;
    }

    public async Task<bool> Add(AddCourseDto addCourseDto, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var courseDomain = await _courseDomainRepository.GetById(addCourseDto.CourseDomainId, cancellationToken);

        if (courseDomain == null)
        {
            _logger.LogInformation("The course domain is not available");

            return false;
        }

        var courseId = Guid.NewGuid();

        var course = new Course
        {
            Id = courseId,
            Name = addCourseDto.Name,
            Description = addCourseDto.Description,
            CreatedByUserId = loggedUserId,
            CourseDomainId = courseDomain.Id,
            CreatedOn = DateTime.UtcNow,
            UpdatedOn = DateTime.UtcNow,
        };

       return await _courseRepository.Add(course, cancellationToken);
    }

    public async Task<List<CourseDto>> GetAllByCourseDomainIds(List<Guid> courseDomainIds, CancellationToken cancellationToken)
    {
        var courses = await _courseRepository.GetAllByCourseDomainIds(courseDomainIds, cancellationToken);

        return courses
            .Select(c => new CourseDto(c.Id, c.Name, c.CourseDomain.Name))
            .ToList();
    }

    public async Task<List<CourseDomainDto>> GetAllCourseDomains(CancellationToken cancellationToken)
    {
        var courseDomains = await _courseDomainRepository.GetAll(cancellationToken);

        return courseDomains
            .Select(c => new CourseDomainDto(c.Id, c.Name))
            .ToList();
    }

    public async Task<bool> Update(UpdateCourseDto updateCourseDto, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(updateCourseDto.Id, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation("The course is not available");

            return false;
        }

        course.Name = updateCourseDto.Name;
        course.Description = updateCourseDto.Description;

        return await _courseRepository.Update(course, cancellationToken);
    }
}
