using Microsoft.EntityFrameworkCore;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;
using UBBGradePortal.Infrastructure.EntityFramework;
using Microsoft.Extensions.Logging;

namespace UBBGradePortal.Infrastructure.Repositories;

public class CourseDomainRepository : ICourseDomainRepository
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<CourseDomainRepository> _logger;

    public CourseDomainRepository(
        ApplicationDbContext dbContext,
        ILogger<CourseDomainRepository> logger
    )
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<List<CourseDomain>> GetAll(CancellationToken cancellationToken)
    {
        return await _dbContext
            .CourseDomains
            .ToListAsync(cancellationToken);
    }

    public async Task<CourseDomain?> GetById(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext
            .CourseDomains
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken: cancellationToken);
    }
}
