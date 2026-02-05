using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace UBBGradePortal.Infrastructure.Repositories;

public class CourseEnrollmentRepository : ICourseEnrollmentRepository
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<CourseEnrollmentRepository> _logger;

    public CourseEnrollmentRepository(
        ApplicationDbContext dbContext,
        ILogger<CourseEnrollmentRepository> logger
    )
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<List<CourseEnrollment>> GetAllByUserId(Guid loggedUserId, CancellationToken cancellationToken)
    {
        return await _dbContext
            .CourseEnrollments
            .Include(ce => ce.Course)
                .ThenInclude(ce => ce.Activities)
            .Include(ce => ce.User)
            .Where(ce => ce.UserId == loggedUserId)
            .ToListAsync(cancellationToken);
    }

    public async Task<CourseEnrollment?> GetByCourseIdAndUserId(Guid courseId, Guid loggedUserId, CancellationToken cancellationToken)
    {
        return await _dbContext
            .CourseEnrollments
            .Include(ce => ce.Course)
            .Include(ce => ce.User)
            .FirstOrDefaultAsync(ce => ce.Course.Id == courseId && ce.User.Id == loggedUserId, cancellationToken: cancellationToken);
    }

    public async Task<bool> Add(List<CourseEnrollment> courseEnrollments, CancellationToken cancellationToken)
    {
        await _dbContext.CourseEnrollments.AddRangeAsync(courseEnrollments, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> Delete(CourseEnrollment courseEnrollment, CancellationToken cancellationToken)
    {
        _dbContext.Remove(courseEnrollment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}