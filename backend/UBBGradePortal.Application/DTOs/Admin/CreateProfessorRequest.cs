namespace UBBGradePortal.Application.DTOs.Admin;

public record CreateProfessorRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password
);
