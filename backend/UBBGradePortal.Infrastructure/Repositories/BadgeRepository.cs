using Microsoft.EntityFrameworkCore;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;

namespace UBBGradePortal.Infrastructure.Repositories;

public class BadgeRepository : IBadgeRepository
{
    private readonly ApplicationDbContext _dbContext;

    public BadgeRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Badge>> GetForUser(Guid userId, CancellationToken cancellationToken)
    {
        return await _dbContext
            .Badges
            .AsNoTracking()
            .Where(badge => badge.UserId == userId)
            .OrderByDescending(badge => badge.CreatedOn)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> AnyForMonth(int year, int month, CancellationToken cancellationToken)
    {
        return await _dbContext
            .Badges
            .AsNoTracking()
            .AnyAsync(badge => badge.Month == month && badge.CreatedOn.Year == year, cancellationToken);
    }

    public async Task AddRange(List<Badge> badges, CancellationToken cancellationToken)
    {
        if (badges.Count == 0)
        {
            return;
        }

        await _dbContext.Badges.AddRangeAsync(badges, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
