using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Abstractions;

public interface IUserService
{
    Task AddUser(User user);
}
