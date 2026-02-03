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
    Task<(int Count, List<SolvedActivity> Activities)> GetAllSolvedActivitiesProfessor(int pageNumber, int pageSize, SolvedActivityStatus status, Guid loggedUserId, CancellationToken cancellationToken);
    Task<Activity?> GetActivityLastSolvedActivity(Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    Task<SolvedActivity?> GetSolvedActivityById(Guid id, CancellationToken cancellationToken);
    Task<Guid> AddSolvedActivity(SolvedActivity solvedActivity, CancellationToken cancellationToken);
    Task<Guid> UpdateSolvedActivity(SolvedActivity solvedActivity, CancellationToken cancellationToken);
    Task<SolvedActivityDocument?> GetSolvedActivityDocument(Guid id, CancellationToken cancellationToken);
    Task<Guid> AddSolvedActivityDocument(SolvedActivityDocument solvedActivityDocument, CancellationToken cancellationToken);
    Task DeleteSolvedActivityDocument(SolvedActivityDocument solvedActivityDocument, CancellationToken cancellationToken);
}
