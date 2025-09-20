using UBBGradePortal.Domain.Enums;

namespace UBBGradePortal.Application.DTOs.User;

public record AddUserDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    Role Role
);