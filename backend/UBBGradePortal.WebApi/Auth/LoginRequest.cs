namespace UBBGradePortal.WebApi.Auth;

public record LoginRequest(
    string Email,
    string Password
);

