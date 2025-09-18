using UBBGradePortal.Domain.Enums;

namespace UBBGradePortal.WebApi.Auth;

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    Role Role,
    List<Guid> CourseIds
);
