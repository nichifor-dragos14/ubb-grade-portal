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

        return await _dbContext
            .Activities
            .Include(a => a.Course)
            .Where(a => a.CourseId == courseId)
            .ToListAsync(cancellationToken);

    }

    public async Task<Activity?> GetById(Guid id, CancellationToken cancellationToken)
    {

        return await _dbContext
            .Activities
            .Include(a => a.Course)
            .Include(a => a.ActivityDocuments)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Guid> Add(Activity activity, CancellationToken cancellationToken)
    {

        await _dbContext.AddAsync(activity, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return activity.Id;
}

    public async Task<Guid> Update(Activity activity, CancellationToken cancellationToken)
    {
        _dbContext.Update(activity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return activity.Id;
    }
    public async Task<ActivityDocument?> GetDocument(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext
            .ActivityDocuments
            .Include(a => a.Activity)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<Guid> AddDocument(ActivityDocument activityDocument, CancellationToken cancellationToken)
    {
        await _dbContext.AddAsync(activityDocument, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return activityDocument.Id;
    }

    public async Task DeleteDocument(ActivityDocument activityDocument, CancellationToken cancellationToken)
    {
        _dbContext.Remove(activityDocument);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
