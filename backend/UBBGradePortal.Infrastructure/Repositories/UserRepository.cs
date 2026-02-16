using Microsoft.EntityFrameworkCore;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Domain.Enums;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;
using Microsoft.Extensions.Logging;

namespace UBBGradePortal.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<UserRepository> _logger;

    public UserRepository(
        ApplicationDbContext dbContext,
        ILogger<UserRepository> logger
    )
    {
        _dbContext = dbContext;
        _logger = logger;
    }


    public async Task<User?> GetById(Guid userId, CancellationToken cancellationToken)
    {
        return await _dbContext
            .Users
            .Include(u => u.CourseEnrollments)
            .Include(u => u.CreatedCourses)
            .Include(u => u.SolvedActivities)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
    }

    public async Task<(int Count, List<User> Users)> GetAll(int pageNumber, int pageSize, Role? role, string? searchQuery, CancellationToken cancellationToken)
    {
        var skip = (pageNumber - 1) * pageSize;
        var query = _dbContext
            .Users
            .AsNoTracking()
            .Where(user => user.Role == Role.Student || user.Role == Role.Professor);

        if (role.HasValue)
        {
            query = query.Where(user => user.Role == role.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchQuery))
        {
            var trimmed = searchQuery.Trim().ToLower();
            query = query.Where(user =>
                (user.FirstName + " " + user.LastName).ToLower().Contains(trimmed) ||
                user.FirstName.ToLower().Contains(trimmed) ||
                user.LastName.ToLower().Contains(trimmed));
        }

        var count = await query.CountAsync(cancellationToken);
        var users = await query
            .OrderByDescending(user => user.CreatedOn ?? DateTime.MinValue)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (count, users);
    }

    public async Task<Guid> Add(User user, CancellationToken cancellationToken)
    {
        await _dbContext.Users.AddAsync(user, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        
        return user.Id;
    }

    public async Task<bool> SetBanned(Guid userId, bool isBanned, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            return false;
        }

        user.IsBanned = isBanned;
        user.UpdatedOn = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
