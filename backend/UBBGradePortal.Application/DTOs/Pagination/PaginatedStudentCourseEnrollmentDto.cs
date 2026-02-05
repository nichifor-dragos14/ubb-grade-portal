using UBBGradePortal.Application.DTOs.Course;

namespace UBBGradePortal.Application.DTOs.Pagination;

public record PaginatedStudentCourseEnrollmentDto(
    int Count,
    List<CourseDto> Enrollments
);
   