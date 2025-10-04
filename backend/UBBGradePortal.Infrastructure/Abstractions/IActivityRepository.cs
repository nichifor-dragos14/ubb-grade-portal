using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface IActivityRepository
{
    Task<List<Activity>> GetAllByCourseId(Guid couseId, CancellationToken cancellationToken);
    Task<Activity?> GetById(Guid id, CancellationToken cancellationToken);
    Task<bool> Add(Activity activity, CancellationToken cancellationToken);
    Task<bool> Update(Activity activity, CancellationToken cancellationToken);
    Task<bool> AddDocument(ActivityDocument activityDocument, CancellationToken cancellationToken);

}
