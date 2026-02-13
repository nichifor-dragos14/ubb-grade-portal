using UBBGradePortal.Application.DTOs.Statistics;

namespace UBBGradePortal.Application.Abstractions;

public interface IStatisticsService
{
    Task<StudentGeneralStatisticsDto> GetStudentGeneralStatistics(Guid loggedUserId, CancellationToken cancellationToken);
    Task<StudentCourseStatisticsDto> GetStudentCourseStatistics(Guid courseId, Guid loggedUserId, CancellationToken cancellationToken);
    Task<ProfessorGeneralStatisticsDto> GetProfessorGeneralStatistics(Guid loggedUserId, CancellationToken cancellationToken);
    Task<ProfessorCourseStatisticsDto> GetProfessorCourseStatistics(Guid courseId, Guid loggedUserId, CancellationToken cancellationToken);
}
