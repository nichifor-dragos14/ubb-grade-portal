namespace UBBGradePortal.Application.DTOs.Admin;

public record AdminUserDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string Role,
    bool IsBanned
);
