using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.Abstractions;

public interface ICourseEnrollmentRepository
{
    Task Add(List<CourseEnrollment> courseEnrollments);
}
