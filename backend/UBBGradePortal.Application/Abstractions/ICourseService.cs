using UBBGradePortal.Application.DTOs.Course;

namespace UBBGradePortal.Application.Abstractions;

public interface ICourseService
{
    public Task<List<CourseDto>> GetAllByCourseDomainIds(List<Guid> courseDomainIds, CancellationToken cancellationToken);
    public Task<CourseDetailsDto?> GetById(Guid id, CancellationToken cancellationToken);
    public Task<PaginatedProfessorCreatedCourseDto> GetAllProfessorCreated(int pageNumber, int pageSize, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<List<CourseDomainDto>> GetAllCourseDomains(CancellationToken cancellationToken);
    public Task<Guid> Add(AddCourseDto addCourseDto, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> Update(UpdateCourseDto updateCourseDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
}
