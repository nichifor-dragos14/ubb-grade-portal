namespace UBBGradePortal.Application.DTOs.Course;

public record PaginatedProfessorCreatedCourseDto(
    int Count,
    List<ProfessorCreatedCourseDto> Courses
);