using UBBGradePortal.Application.DTOs.Course;

namespace UBBGradePortal.Application.Abstractions;

public interface ICourseService
{
    public Task<List<CourseDto>> GetAllByCourseDomainIds(List<Guid> courseDomainIds, CancellationToken cancellationToken);
    public Task<List<CourseDomainDto>> GetAllCourseDomains(CancellationToken cancellationToken);
}
