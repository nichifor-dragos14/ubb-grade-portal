using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Abstractions;

public interface IUserService
{
    Task<User?> GetById(Guid userId);
    Task Add(User user);
    Task EnrollToCourses(Guid userId, List<Guid> courseIds);
}
