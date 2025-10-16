using Microsoft.EntityFrameworkCore;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;
using Microsoft.Extensions.Logging;

namespace UBBGradePortal.Infrastructure.Repositories;

public class CourseRepository : ICourseRepository
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<CourseRepository> _logger;

    public CourseRepository(
        ApplicationDbContext dbContext,
        ILogger<CourseRepository> logger
    )
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<List<Course>> GetAll(CancellationToken cancellationToken)
    {
        return await _dbContext
            .Courses
            .Include(c => c.CourseDomain)
            .Include(c => c.CourseEnrollments)
            .Include (c => c.Activities)
            .Include(c => c.CreatedByUser)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Course>> GetAllByCourseDomainIds(List<Guid> courseDomainIds, CancellationToken cancellationToken)
    {
        return await _dbContext
            .Courses
            .Include(c => c.CourseDomain)
            .Where(c => courseDomainIds.Contains(c.CourseDomainId))
            .ToListAsync(cancellationToken);
    }

    public async Task<(int Count, List<Course> Courses)> GetAllProfessorCreated(int pageNumber, int pageSize, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var courses = await _dbContext
            .Courses
            .Include(c => c.CourseDomain)
            .Include(c => c.CourseEnrollments)
            .Include(c => c.Activities)
            .Include(c => c.CreatedByUser)
            .Where(c => c.CreatedByUserId == loggedUserId)
            .OrderByDescending(c => c.UpdatedOn)
            .ToListAsync(cancellationToken);

        var count = courses.Count;

        return (
            count,
            courses
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList()
        );
    }

    public async Task<(int Count, List<CourseEnrollment> CourseEnrollments)> GetAllStudentCourseEnrollments(int pageNumber, int pageSize, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var courseEnrollments = await _dbContext
            .CourseEnrollments
            .Include(c => c.Course)
            .ThenInclude(c => c.Activities)
            .Include(c => c.Course)
            .ThenInclude(c => c.CourseDomain)
            .Include(c => c.User)
            .ThenInclude(c => c.SolvedActivities)
            .Where(c => c.UserId == loggedUserId)
            .OrderByDescending(c => c.CreatedOn)
            .ToListAsync(cancellationToken);

        var count = courseEnrollments.Count;

        return (
            count,
            courseEnrollments
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList()
        );
    }

    public async Task<Course?> GetById(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext
            .Courses
            .Include(c => c.CreatedByUser)
            .Include(c => c.CourseDomain)
            .Include(c => c.CourseEnrollments)
            .Include(c => c.Activities)
            .ThenInclude(c => c.ActivityDocuments)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Guid> Add(Course course, CancellationToken cancellationToken)
    {
        await _dbContext.AddAsync(course, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return course.Id;
}


    public async Task<Guid> Update(Course course, CancellationToken cancellationToken)
    {
        _dbContext.Update(course);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return course.Id;
    }
}
