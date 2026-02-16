using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface IBadgeRepository
{
    Task<List<Badge>> GetForUser(Guid userId, CancellationToken cancellationToken);
    Task<bool> AnyForMonth(int year, int month, CancellationToken cancellationToken);
    Task AddRange(List<Badge> badges, CancellationToken cancellationToken);
}
