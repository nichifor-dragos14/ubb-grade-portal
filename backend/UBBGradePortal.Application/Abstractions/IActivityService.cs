using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Application.DTOs.Document;

namespace UBBGradePortal.Application.Abstractions;

public interface IActivityService
{
    public Task<List<ActivityDto>> GetAllByCourseId(Guid courseId, CancellationToken cancellationToken);
    public Task<ActivityDto?> GetById(Guid id, CancellationToken cancellationToken);
    public Task<Guid> Add(AddActivityDto addActivityDto, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> Update(UpdateActivityDto updateActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> AddDocument(AddDocumentDto addDocumentDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task DeleteDocument(Guid documentId, Guid loggedUserId, CancellationToken cancellationToken);
}
