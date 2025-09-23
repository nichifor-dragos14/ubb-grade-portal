using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface ICourseRepository
{
    public Task<List<Course>> GetAllProfessorCreated(Guid loggedUserId, CancellationToken cancellationToken);
    Task<List<Course>> GetAllByCourseDomainIds(List<Guid> courseDomainIds, CancellationToken cancellationToken);
    Task<List<Course>> GetAll(CancellationToken cancellationToken);
    Task<Course?> GetById(Guid id, CancellationToken cancellationToken);
    Task<bool> Add(Course course, CancellationToken cancellationToken);
    Task<bool> Update(Course course, CancellationToken cancellationToken);
}
