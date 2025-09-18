using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;

namespace UBBGradePortal.Infrastructure.Repositories;

public class CourseEnrollmentRepository : ICourseEnrollmentRepository
{
    private readonly ApplicationDbContext _dbContext;

    public CourseEnrollmentRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task Add(List<CourseEnrollment> courseEnrollments)
    {

        _dbContext.CourseEnrollments.AddRange(courseEnrollments);
        await _dbContext.SaveChangesAsync();
    }
}
