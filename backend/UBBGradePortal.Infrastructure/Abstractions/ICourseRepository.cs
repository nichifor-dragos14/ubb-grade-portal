using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface ICourseRepository
{
    Task<List<Course>> GetAll(CancellationToken cancellationToken);
}
