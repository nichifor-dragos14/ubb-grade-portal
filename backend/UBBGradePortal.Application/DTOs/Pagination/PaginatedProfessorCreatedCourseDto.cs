using UBBGradePortal.Application.DTOs.Course;

namespace UBBGradePortal.Application.DTOs.Pagination;

public record PaginatedProfessorCreatedCourseDto(
    int Count,
    List<CourseDto> Courses
);