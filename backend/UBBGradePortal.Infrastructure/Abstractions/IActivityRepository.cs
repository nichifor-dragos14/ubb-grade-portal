using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface IActivityRepository
{
    Task<List<Activity>> GetAllByCourseId(Guid couseId, CancellationToken cancellationToken);
    Task<Activity?> GetById(Guid id, CancellationToken cancellationToken);
    Task<Guid> Add(Activity activity, CancellationToken cancellationToken);
    Task<Guid> Update(Activity activity, CancellationToken cancellationToken);
    Task<ActivityDocument?> GetDocument(Guid id, CancellationToken cancellationToken);
    Task<Guid> AddDocument(ActivityDocument activityDocument, CancellationToken cancellationToken);
    Task DeleteDocument(ActivityDocument activityDocument, CancellationToken cancellationToken);
}
