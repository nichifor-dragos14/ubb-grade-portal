using UBBGradePortal.Application.DTOs.Pagination;
using UBBGradePortal.Application.DTOs.SolvedActivity;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Abstractions;

public interface ISolvedActivityService
{
    Task<PaginatedProfessorSolvedActivityDto> GetAllByStatusForProfessorCourses(int pageNumber, int pageSize, SolvedActivityStatus status, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<SolvedActivityDto?> GetLastByActivityId(Guid activityId, Guid loggedUserId, CancellationToken cancellationToken);
    Task<SolvedActivityDto?> GetById(Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> Add(AddSolvedActivityDto addSolvedActivityDto, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> Update(UpdateSolvedActivityDto updateSolvedActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task<Guid> GradeSolvedActivity(GradeSolvedActivityDto gradeSolvedActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken);
    public Task DeleteDocument(Guid id, Guid loggedUserId, CancellationToken cancellationToken);
}
