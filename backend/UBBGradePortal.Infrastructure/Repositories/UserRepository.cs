using Microsoft.EntityFrameworkCore;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;

namespace UBBGradePortal.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _dbContext;

    public UserRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task Add(User user, CancellationToken cancellationToken)
    {
        _dbContext.Users.Add(user);

        await _dbContext.SaveChangesAsync(cancellationToken);
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
}
