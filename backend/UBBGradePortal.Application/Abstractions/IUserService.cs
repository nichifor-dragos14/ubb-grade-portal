using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Abstractions;

public interface IUserService
{
    Task<User?> GetById(Guid userId, CancellationToken cancellationToken);
    Task Add(User user, CancellationToken cancellationToken);
    Task EnrollToCourses(Guid userId, List<Guid> courseIds, CancellationToken cancellationToken);
}
