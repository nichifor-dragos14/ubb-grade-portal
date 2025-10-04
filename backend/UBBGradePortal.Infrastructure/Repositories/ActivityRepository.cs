using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;

namespace UBBGradePortal.Infrastructure.Repositories;

public class ActivityRepository : IActivityRepository
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ActivityRepository> _logger;

    public ActivityRepository(
        ApplicationDbContext dbContext,
        ILogger<ActivityRepository> logger
    )
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<List<Activity>> GetAllByCourseId(Guid courseId, CancellationToken cancellationToken)
    {
        try
        {
            return await _dbContext
                .Activities
                .Include(a => a.Course)
                .Where(a => a.CourseId == courseId)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return [];
        }
    }

    public async Task<Activity?> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return await _dbContext
                .Activities
                .Include(a => a.Course)
                .Include(a => a.ActivityDocuments)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return null;
        }
    }

    public async Task<bool> Add(Activity activity, CancellationToken cancellationToken)
    {
        try
        {
            await _dbContext.AddAsync(activity, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return false;
        }
    }

    public async Task<bool> Update(Activity activity, CancellationToken cancellationToken)
    {
        try
        {
            _dbContext.Update(activity);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return false;
        }
    }

    public async Task<bool> AddDocument(ActivityDocument activityDocument, CancellationToken cancellationToken)
    {
        try
        {
            await _dbContext.AddAsync(activityDocument, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return false;
        }
    }
}
