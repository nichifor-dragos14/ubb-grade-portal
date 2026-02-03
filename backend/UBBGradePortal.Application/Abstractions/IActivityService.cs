using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Abstractions;

public interface IActivityService
{
    public Task<List<ActivityDto>> GetAllByCourseId(Guid courseId, CancellationToken cancellationToken);
    public Task<ActivityDetailsDto?> GetById(Guid id, CancellationToken cancellationToken);
    public Task<Guid> Add(AddActivityDto addActivityDto, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> Update(UpdateActivityDto updateActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> AddDocument(AddActivityDocumentDto addCourseDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task DeleteDocument(Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    Task<PaginatedProfessorSolvedActivityDto> GetAllSolvedActivitiesProfessor(int pageNumber, int pageSize, SolvedActivityStatus status, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<SolvedActivityDetailsDto?> GetActivityLastSolvedActivity(Guid activityId, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> AddSolvedActivity(AddSolvedActivityDto addSolvedActivityDto, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> UpdateSolvedActivity(UpdateSolvedActivityDto updateSolvedActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task DeleteSolvedActivityDocument(Guid id, Guid loggedUserId, CancellationToken cancellationToken);
}
