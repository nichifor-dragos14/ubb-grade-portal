using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Course;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class CourseService : ICourseService
{
    private readonly ICourseRepository _courseRepository;
    private readonly ICourseDomainRepository _courseDomainRepository;
    
    public CourseService(
        ICourseRepository courseRepository,
        ICourseDomainRepository courseDomainRepository)
    {
        _courseRepository = courseRepository;
        _courseDomainRepository = courseDomainRepository;
    }

    public async Task<List<CourseDto>> GetAll(CancellationToken cancellationToken)
    {
        var courses = await _courseRepository.GetAll(cancellationToken);

        return courses.Select(c => new CourseDto
            {
                CourseId = c.Id,
                Name = c.Name,
            })
            .ToList();
    }

    public async Task<List<CourseDomainDto>> GetAllCourseDomains(CancellationToken cancellationToken)
    {
        var courseDomains = await _courseDomainRepository.GetAll(cancellationToken);

        return courseDomains.Select(c => new CourseDomainDto
            {
                CourseDomainId = c.Id,
                Name = c.Name,
            })
            .ToList();
    }
}
