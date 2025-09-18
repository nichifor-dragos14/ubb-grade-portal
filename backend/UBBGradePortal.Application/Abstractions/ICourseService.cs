using UBBGradePortal.Application.DTOs.Course;

namespace UBBGradePortal.Application.Abstractions;

public interface ICourseService
{
    public Task<List<CourseDto>> GetAll(CancellationToken cancellationToken);
    public Task<List<CourseDomainDto>> GetAllCourseDomains(CancellationToken cancellationToken);
}
