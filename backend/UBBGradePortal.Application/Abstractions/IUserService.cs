using UBBGradePortal.Application.DTOs.Pagination;
using UBBGradePortal.Application.DTOs.User;
using UBBGradePortal.Domain.Enums;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Abstractions;

public interface IUserService
{
    Task<User?> GetById(Guid userId, CancellationToken cancellationToken);
    Task<PaginatedAdminUsersDto> GetAll(int pageNumber, int pageSize, Role? role, string? searchQuery, CancellationToken cancellationToken);
    Task<Guid> Add(AddUserDto addUserDto, CancellationToken cancellationToken);
    Task<bool> EnrollToCourses(Guid userId, List<Guid> courseIds, CancellationToken cancellationToken);
    Task<bool> SetBanned(Guid userId, bool isBanned, CancellationToken cancellationToken);
}
