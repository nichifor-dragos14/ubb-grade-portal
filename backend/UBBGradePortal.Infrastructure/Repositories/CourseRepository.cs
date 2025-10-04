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

    public async Task<bool> Add(Course course, CancellationToken cancellationToken)
    {
        try
        {
            await _dbContext.AddAsync(course, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return false;
        }
    }

    public async Task<List<Course>> GetAll(CancellationToken cancellationToken)
    {
        try
        {
            return await _dbContext
                .Courses
                .Include(c => c.CourseDomain)
                .Include(c => c.CourseEnrollments)
                .Include (c => c.Activities)
                .Include(c => c.CreatedByUser)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return [];
        }
    }

    public async Task<List<Course>> GetAllByCourseDomainIds(List<Guid> courseDomainIds, CancellationToken cancellationToken)
    {
        try
        {
            return await _dbContext
                .Courses
                .Include(c => c.CourseDomain)
                .Where(c => courseDomainIds.Contains(c.CourseDomainId))
                .ToListAsync(cancellationToken);
        }
        catch(Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return [];
        }
    }

    public async Task<(int Count, List<Course> Courses)> GetAllProfessorCreated(int pageNumber, int pageSize, Guid loggedUserId, CancellationToken cancellationToken)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return (0, []);
        }
    }

    public async Task<Course?> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message.ToString());

            return null;
        }
    }

    public async Task<bool> Update(Course course, CancellationToken cancellationToken)
    {
        try
        {
            _dbContext.Update(course);
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
