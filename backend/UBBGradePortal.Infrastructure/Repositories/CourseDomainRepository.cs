using Microsoft.EntityFrameworkCore;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;

namespace UBBGradePortal.Infrastructure.Repositories;

public class CourseDomainRepository : ICourseDomainRepository
{
    private readonly ApplicationDbContext _dbContext;

    public CourseDomainRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CourseDomain>> GetAll(CancellationToken cancellationToken)
    {
        return await _dbContext.CourseDomains.ToListAsync(cancellationToken);
    }
}
