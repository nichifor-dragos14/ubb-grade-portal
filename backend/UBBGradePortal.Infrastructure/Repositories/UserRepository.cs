using Microsoft.EntityFrameworkCore;
using UBBGradePortal.Domain.Entities;
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

    public async Task<bool> Add(User user, CancellationToken cancellationToken)
    {
        try
        {
            await _dbContext.Users.AddAsync(user, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return false;
        }
        
    }

    public async Task<User?> GetById(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            return await _dbContext
                .Users
                .Include(u => u.CourseEnrollments)
                .Include(u => u.CreatedCourses)
                .Include(u => u.SolvedActivities)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return null;
        }
    }
}
