using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface IUserRepository
{
    Task<User?> GetById(Guid userId, CancellationToken cancellationToken);
    Task<Guid> Add(User user, CancellationToken cancellationToken);
}
