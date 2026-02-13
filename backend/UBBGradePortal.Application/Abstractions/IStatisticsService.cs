using UBBGradePortal.Application.DTOs.Statistics;

namespace UBBGradePortal.Application.Abstractions;

public interface IStatisticsService
{
    Task<StudentGeneralStatisticsDto> GetStudentGeneralStatistics(Guid loggedUserId, CancellationToken cancellationToken);
    Task<StudentCourseStatisticsDto> GetStudentCourseStatistics(Guid courseId, Guid loggedUserId, CancellationToken cancellationToken);
}
