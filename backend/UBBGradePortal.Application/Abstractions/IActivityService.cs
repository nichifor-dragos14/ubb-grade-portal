using UBBGradePortal.Application.DTOs.Activity;

namespace UBBGradePortal.Application.Abstractions;

public interface IActivityService
{
    public Task<List<ActivityDto>> GetAllByCourseId(Guid courseId, CancellationToken cancellationToken);
    public Task<ActivityDetailsDto?> GetById(Guid id, CancellationToken cancellationToken);
    public Task<Guid> Add(AddActivityDto addActivityDto, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> Update(UpdateActivityDto updateActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> AddDocument(AddActivityDocumentDto addCourseDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
}
