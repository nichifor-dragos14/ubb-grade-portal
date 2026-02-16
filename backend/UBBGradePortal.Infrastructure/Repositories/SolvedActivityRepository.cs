using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Domain.Enums;
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
    public async Task<(int Count, List<SolvedActivity> Activities)> GetAllByStatusForProfessorCourses(int pageNumber, int pageSize, SolvedActivityStatus? status, string? studentName, Guid? courseId, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var query = _dbContext
            .SolvedActivities
            .AsNoTracking()
            .Include(sa => sa.User)
            .Include(sa => sa.Activity)
                .ThenInclude(a => a.Course)
                .ThenInclude(a => a.CreatedByUser)
            .Where(sa => sa.Activity.Course.CreatedByUser.Id == loggedUserId);

        query = query.Where(sa => !sa.User.IsBanned);

        if (status.HasValue)
        {
            query = query.Where(sa => sa.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(studentName))
        {
            var search = studentName.Trim().ToLower();
            query = query.Where(sa =>
                (sa.User.FirstName + " " + sa.User.LastName).ToLower().Contains(search) ||
                (sa.User.LastName + " " + sa.User.FirstName).ToLower().Contains(search));
        }

        if (courseId.HasValue)
        {
            query = query.Where(sa => sa.Activity.CourseId == courseId);
        }

        var solvedActivities = await query
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

    public async Task<int> CountSubmittedForCourse(Guid courseId, CancellationToken cancellationToken)
    {
        return await _dbContext
            .SolvedActivities
            .AsNoTracking()
            .Include(sa => sa.User)
            .Include(sa => sa.Activity)
                .ThenInclude(a => a.Course)
            .Where(sa => sa.Activity.CourseId == courseId && sa.Status == SolvedActivityStatus.Submitted)
            .Where(sa => !sa.User.IsBanned)
            .CountAsync(cancellationToken);
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

    public async Task<List<SubmissionCountByUser>> GetSubmissionCountsByUser(DateTime startDateUtc, DateTime endDateUtc, CancellationToken cancellationToken)
    {
        return await _dbContext
            .SolvedActivities
            .AsNoTracking()
            .Include(sa => sa.User)
            .Where(sa => sa.CreatedOn >= startDateUtc && sa.CreatedOn < endDateUtc)
            .Where(sa => sa.User.Role == Role.Student)
            .Where(sa => !sa.User.IsBanned)
            .GroupBy(sa => new { sa.UserId, sa.User.FirstName, sa.User.LastName })
            .Select(group => new SubmissionCountByUser(
                group.Key.UserId,
                group.Key.FirstName,
                group.Key.LastName,
                group.Count()
            ))
            .ToListAsync(cancellationToken);
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
