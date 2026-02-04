using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface ISolvedActivityRepository
{
    Task<(int Count, List<SolvedActivity> Activities)> GetAllByStatusForProfessorCourses(int pageNumber, int pageSize, SolvedActivityStatus status, Guid loggedUserId, CancellationToken cancellationToken);
    Task<SolvedActivity?> GetById(Guid id, CancellationToken cancellationToken);
    Task<Guid> Add(SolvedActivity solvedActivity, CancellationToken cancellationToken);
    Task<Guid> Update(SolvedActivity solvedActivity, CancellationToken cancellationToken);
    Task<SolvedActivityDocument?> GetDocument(Guid documentId, CancellationToken cancellationToken);
    Task<Guid> AddDocument(SolvedActivityDocument document, CancellationToken cancellationToken);
    Task DeleteDocument(SolvedActivityDocument document, CancellationToken cancellationToken);
}
