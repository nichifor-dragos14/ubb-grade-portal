using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface IUserRepository
{
    Task AddUser(User user);
}
