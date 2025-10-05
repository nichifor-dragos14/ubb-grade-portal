using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;
using Microsoft.Extensions.Logging;

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

    public async Task<bool> Add(List<CourseEnrollment> courseEnrollments, CancellationToken cancellationToken)
    {
        await _dbContext.CourseEnrollments.AddRangeAsync(courseEnrollments, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}