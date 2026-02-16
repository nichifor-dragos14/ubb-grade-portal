using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Domain.Enums;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface IUserRepository
{
    Task<User?> GetById(Guid userId, CancellationToken cancellationToken);
    Task<(int Count, List<User> Users)> GetAll(int pageNumber, int pageSize, Role? role, string? searchQuery, CancellationToken cancellationToken);
    Task<Guid> Add(User user, CancellationToken cancellationToken);
    Task<bool> SetBanned(Guid userId, bool isBanned, CancellationToken cancellationToken);
}
