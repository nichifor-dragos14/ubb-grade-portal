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

    public async Task<Activity?> GetActivityLastSolvedActivity(Guid activityId, Guid loggedUserId, CancellationToken cancellationToken)
    {
        return await _dbContext.Activities
            .Include(a => a.ActivityDocuments)
            .Include(a => a.SolvedActivities
                .Where(s => s.UserId == loggedUserId)
                .OrderByDescending(s => s.CreatedOn)
                .Take(1))
                .ThenInclude(s => s.SolvedActivityDocuments)
            .FirstOrDefaultAsync(a => a.Id == activityId, cancellationToken);
    }

    public async Task<SolvedActivity?> GetSolvedActivityById(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext
            .SolvedActivities
            .Include(s => s.SolvedActivityDocuments)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Guid> AddSolvedActivity(SolvedActivity solvedActivity, CancellationToken cancellationToken)
    {
        await _dbContext.AddAsync(solvedActivity, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return solvedActivity.Id;
    }

    public async Task<Guid> UpdateSolvedActivity(SolvedActivity solvedActivity, CancellationToken cancellationToken)
    {
        _dbContext.Update(solvedActivity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return solvedActivity.Id;
    }

    public async Task<SolvedActivityDocument?> GetSolvedActivityDocument(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext
            .SolvedActivityDocuments
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<Guid> AddSolvedActivityDocument(SolvedActivityDocument solvedActivityDocument, CancellationToken cancellationToken)
    {
        await _dbContext.AddAsync(solvedActivityDocument, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return solvedActivityDocument.Id;
    }

    public async Task DeleteSolvedActivityDocument(SolvedActivityDocument solvedActivityDocument, CancellationToken cancellationToken)
    {
        _dbContext.Remove(solvedActivityDocument);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
