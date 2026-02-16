using UBBGradePortal.Application.DTOs.User;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Abstractions;

public interface IUserService
{
    Task<User?> GetById(Guid userId, CancellationToken cancellationToken);
    Task<List<User>> GetAll(CancellationToken cancellationToken);
    Task<Guid> Add(AddUserDto addUserDto, CancellationToken cancellationToken);
    Task<bool> EnrollToCourses(Guid userId, List<Guid> courseIds, CancellationToken cancellationToken);
    Task<bool> SetBanned(Guid userId, bool isBanned, CancellationToken cancellationToken);
}
