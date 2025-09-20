using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface ICourseDomainRepository
{
    Task<List<CourseDomain>> GetAll(CancellationToken cancellationToken);
    Task<CourseDomain?> GetById(Guid id, CancellationToken cancellationToken);
}
