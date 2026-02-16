using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface IUserRepository
{
    Task<User?> GetById(Guid userId, CancellationToken cancellationToken);
    Task<List<User>> GetAll(CancellationToken cancellationToken);
    Task<Guid> Add(User user, CancellationToken cancellationToken);
    Task<bool> SetBanned(Guid userId, bool isBanned, CancellationToken cancellationToken);
}
