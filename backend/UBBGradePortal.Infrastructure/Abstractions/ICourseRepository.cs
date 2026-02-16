using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface ICourseRepository
{
    public Task<(int Count, List<Course> Courses)> GetAllProfessorCreated(int pageNumber, int pageSize, Guid loggedUserId, CancellationToken cancellationToken);
    Task<List<Course>> GetAllProfessorCreatedWithActivities(Guid loggedUserId, CancellationToken cancellationToken);
    Task<List<Course>> GetAllProfessorCreated(Guid loggedUserId, CancellationToken cancellationToken);
    public Task<(int Count, List<CourseEnrollment> CourseEnrollments)> GetAllStudentCourseEnrollments(int pageNumber, int pageSize, Guid loggedUserId, CancellationToken cancellationToken);
    Task<List<CourseEnrollment>> GetAllStudentCourseEnrollments(Guid loggedUserId, CancellationToken cancellationToken);
    Task<List<Course>> GetAllByCourseDomainIds(List<Guid> courseDomainIds, CancellationToken cancellationToken);
    Task<List<Course>> GetAllBySearchString(string searchString, CancellationToken cancellationToken);
    Task<List<Course>> GetAll(CancellationToken cancellationToken);
    Task<Course?> GetById(Guid id, CancellationToken cancellationToken);
    Task<Guid> Add(Course course, CancellationToken cancellationToken);
    Task<Guid> Update(Course course, CancellationToken cancellationToken);
}
