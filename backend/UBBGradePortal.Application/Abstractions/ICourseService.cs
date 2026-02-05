using UBBGradePortal.Application.DTOs.Course;
using UBBGradePortal.Application.DTOs.CourseDomain;
using UBBGradePortal.Application.DTOs.Pagination;

namespace UBBGradePortal.Application.Abstractions;

public interface ICourseService
{
    public Task<List<CourseDto>> GetAllByCourseDomainIds(List<Guid> courseDomainIds, CancellationToken cancellationToken);
    public Task<CourseDto?> GetById(Guid id, CancellationToken cancellationToken);
    Task<List<CourseDto>> GetAllStudentCoursesByRecommendationOrSearchString(string? searchString, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<CourseDto?> GetByIdStudent(Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<PaginatedProfessorCreatedCourseDto> GetAllProfessorCreated(int pageNumber, int pageSize, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<PaginatedStudentCourseEnrollmentDto> GetAllStudentCourseEnrollments(int pageNumber, int pageSize, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<List<CourseDomainDto>> GetAllCourseDomains(CancellationToken cancellationToken);
    public Task<Guid> Add(AddCourseDto addCourseDto, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> Update(UpdateCourseDto updateCourseDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<bool> EnrollToCourse(Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<bool> UnenrollFromCourse(Guid id, Guid loggedUserId, CancellationToken cancellationToken);
}
