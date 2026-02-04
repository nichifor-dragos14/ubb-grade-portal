using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;

namespace UBBGradePortal.Infrastructure.Repositories;

public class SolvedActivityRepository : ISolvedActivityRepository
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<SolvedActivityRepository> _logger;

    public SolvedActivityRepository(
        ApplicationDbContext dbContext,
        ILogger<SolvedActivityRepository> logger
    )
    {
        _dbContext = dbContext;
        _logger = logger;
    }
    public async Task<(int Count, List<SolvedActivity> Activities)> GetAllByStatusForProfessorCourses(int pageNumber, int pageSize, SolvedActivityStatus status, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var solvedActivities = await _dbContext
            .SolvedActivities
            .AsNoTracking()
            .Include(sa => sa.User)
            .Include(sa => sa.Activity)
                .ThenInclude(a => a.Course)
                .ThenInclude(a => a.CreatedByUser)
            .Where(sa => sa.Activity.Course.CreatedByUser.Id == loggedUserId && sa.Status == status)
            .OrderByDescending(sa => sa.UpdatedOn)
            .ToListAsync(cancellationToken);

        var count = solvedActivities.Count;

        return (
            count,
            solvedActivities
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList()
        );
    }

    public async Task<SolvedActivity?> GetById(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext
            .SolvedActivities
            .Include(sa => sa.SolvedActivityDocuments)
            .Include(sa => sa.User)
            .Include(sa => sa.Activity)
                .ThenInclude(a => a.ActivityDocuments)
            .Include(sa => sa.Activity)
                .ThenInclude(a => a.Course)
                .ThenInclude(c => c.CreatedByUser)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Guid> Add(SolvedActivity solvedActivity, CancellationToken cancellationToken)
    {
        await _dbContext.AddAsync(solvedActivity, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return solvedActivity.Id;
    }

    public async Task<Guid> Update(SolvedActivity solvedActivity, CancellationToken cancellationToken)
    {
        _dbContext.Update(solvedActivity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return solvedActivity.Id;
    }

    public async Task<SolvedActivityDocument?> GetDocument(Guid documentId, CancellationToken cancellationToken)
    {
        return await _dbContext
            .SolvedActivityDocuments
            .Include(sad => sad.SolvedActivity)
                .ThenInclude(sa => sa.User)
            .FirstOrDefaultAsync(a => a.Id == documentId, cancellationToken);
    }

    public async Task<Guid> AddDocument(SolvedActivityDocument document, CancellationToken cancellationToken)
    {
        await _dbContext.AddAsync(document, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return document.Id;
    }

    public async Task DeleteDocument(SolvedActivityDocument document, CancellationToken cancellationToken)
    {
        _dbContext.Remove(document);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
