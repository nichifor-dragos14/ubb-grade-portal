namespace UBBGradePortal.Application.DTOs.Course;

public record PaginatedStudentCourseEnrollmentDto(
    int Count,
    List<StudentEnrollmentDto> Enrollments
);
   