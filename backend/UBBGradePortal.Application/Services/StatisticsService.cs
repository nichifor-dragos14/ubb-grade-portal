using Microsoft.Extensions.Logging;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Statistics;
using UBBGradePortal.Application.Exceptions;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class StatisticsService : IStatisticsService
{
    private readonly IUserRepository _userRepository;
    private readonly ICourseRepository _courseRepository;
    private readonly ICourseEnrollmentRepository _courseEnrollmentRepository;
    private readonly ILogger<StatisticsService> _logger;

    public StatisticsService(
        IUserRepository userRepository,
        ICourseRepository courseRepository,
        ICourseEnrollmentRepository courseEnrollmentRepository,
        ILogger<StatisticsService> logger
    )
    {
        _userRepository = userRepository;
        _courseRepository = courseRepository;
        _courseEnrollmentRepository = courseEnrollmentRepository;
        _logger = logger;
    }

    public async Task<StudentGeneralStatisticsDto> GetStudentGeneralStatistics(Guid loggedUserId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetById(loggedUserId, cancellationToken);

        if (user == null)
        {
            _logger.LogInformation("User {UserId} not found", loggedUserId);
            throw new NotFoundException("The user does not exist");
        }

        var enrollments = await _courseEnrollmentRepository.GetAllByUserId(loggedUserId, cancellationToken);
        var courses = enrollments
            .Select(e => e.Course)
            .DistinctBy(c => c.Id)
            .ToList();

        var totalCoursesCount = (await _courseRepository.GetAll(cancellationToken)).Count;
        var totalActivitiesCount = courses.Sum(course => course.Activities.Count);

        var activityToCourseId = courses
            .SelectMany(course => course.Activities.Select(activity => new { activity.Id, CourseId = course.Id }))
            .ToDictionary(item => item.Id, item => item.CourseId);

        var solvedActivities = user.SolvedActivities ?? [];
        var solvedActivitiesForEnrollments = solvedActivities
            .Where(sa => activityToCourseId.ContainsKey(sa.ActivityId))
            .ToList();

        var solvedActivityIds = solvedActivitiesForEnrollments
            .Select(sa => sa.ActivityId)
            .Distinct()
            .ToList();

        var solvedActivitiesCount = solvedActivityIds.Count;

        var solvedCountByCourse = solvedActivitiesForEnrollments
            .GroupBy(sa => activityToCourseId[sa.ActivityId])
            .ToDictionary(
                g => g.Key,
                g => g.Select(sa => sa.ActivityId).Distinct().Count()
            );

        var courseOptions = courses
            .Select(course => new StudentCourseOptionDto
            {
                Id = course.Id,
                Name = course.Name,
                TotalActivitiesCount = course.Activities.Count,
                SolvedActivitiesCount = solvedCountByCourse.TryGetValue(course.Id, out var count) ? count : 0
            })
            .OrderBy(course => course.Name)
            .ToList();

        Guid? defaultCourseId = null;

        if (courseOptions.Count != 0)
        {
            defaultCourseId = courseOptions
                .OrderByDescending(course => course.SolvedActivitiesCount)
                .ThenBy(course => course.Name)
                .Select(course => course.Id)
                .FirstOrDefault();
        }

        var topDomains = courses
            .Where(course => course.CourseDomain != null)
            .GroupBy(course => course.CourseDomain!.Name)
            .Select(group => new CourseDomainStatDto
            {
                Name = group.Key,
                CoursesCount = group.Count()
            })
            .OrderByDescending(stat => stat.CoursesCount)
            .ThenBy(stat => stat.Name)
            .Take(3)
            .ToList();

        return new StudentGeneralStatisticsDto
        {
            StudentName = string.Join(" ", new[] { user.FirstName, user.LastName }.Where(part => !string.IsNullOrWhiteSpace(part))),
            EnrolledCoursesCount = courses.Count,
            TotalCoursesCount = totalCoursesCount,
            SolvedActivitiesCount = solvedActivitiesCount,
            TotalActivitiesCount = totalActivitiesCount,
            DefaultCourseId = defaultCourseId,
            Courses = courseOptions,
            TopDomains = topDomains
        };
    }

    public async Task<StudentCourseStatisticsDto> GetStudentCourseStatistics(Guid courseId, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(courseId, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation("Course {CourseId} not found", courseId);
            throw new NotFoundException("The course does not exist");
        }

        var isEnrolled = course.CourseEnrollments.Any(e => e.UserId == loggedUserId);

        if (!isEnrolled)
        {
            _logger.LogInformation("User {UserId} is not enrolled in course {CourseId}", loggedUserId, courseId);
            throw new ForbiddenException("Not enrolled to this course");
        }

        var activities = course.Activities;
        var solvedActivities = activities
            .SelectMany(activity => activity.SolvedActivities)
            .Where(sa => sa.UserId == loggedUserId)
            .ToList();

        var latestSolvedActivities = GetLatestSolvedActivities(solvedActivities)
            .ToList();

        var totalActivitiesCount = activities.Count;
        var activitiesWithSolvedCount = latestSolvedActivities.Count;

        var submittedCount = latestSolvedActivities.Count(sa => sa.Status == SolvedActivityStatus.Submitted);
        var completedCount = latestSolvedActivities.Count(sa => sa.Status == SolvedActivityStatus.Completed);
        var returnedCount = latestSolvedActivities.Count(sa => sa.Status == SolvedActivityStatus.Returned);

        var completionPercentage = totalActivitiesCount == 0
            ? 0
            : Math.Round((double)activitiesWithSolvedCount * 100 / totalActivitiesCount, 2);

        var studentAverageGrade = totalActivitiesCount == 0
            ? 0
            : Math.Round(latestSolvedActivities.Sum(sa => sa.Grade) / (double)totalActivitiesCount, 2);

        var allStudentsAverageGrade = CalculateAllStudentsAverageGrade(course, totalActivitiesCount, loggedUserId);

        return new StudentCourseStatisticsDto
        {
            CourseId = course.Id,
            CourseName = course.Name,
            TotalActivitiesCount = totalActivitiesCount,
            ActivitiesWithSolvedCount = activitiesWithSolvedCount,
            TotalSolvedActivitiesCount = activitiesWithSolvedCount,
            SubmittedCount = submittedCount,
            CompletedCount = completedCount,
            ReturnedCount = returnedCount,
            CompletionPercentage = completionPercentage,
            StudentAverageGrade = studentAverageGrade,
            AllStudentsAverageGrade = allStudentsAverageGrade
        };
    }

    private static IEnumerable<SolvedActivity> GetLatestSolvedActivities(IEnumerable<SolvedActivity> solvedActivities)
    {
        return solvedActivities
            .GroupBy(sa => sa.ActivityId)
            .Select(group => group
                .OrderByDescending(sa => sa.UpdatedOn ?? sa.CreatedOn ?? DateTime.MinValue)
                .First()
            );
    }

    private static double CalculateAllStudentsAverageGrade(Course course, int totalActivitiesCount, Guid loggedUserId)
    {
        var studentIds = course.CourseEnrollments
            .Select(e => e.UserId)
            .Where(id => id != loggedUserId)
            .Distinct()
            .ToList();
        var studentCount = studentIds.Count;

        if (totalActivitiesCount == 0 || studentCount == 0)
        {
            return 0;
        }

        var allSolvedActivities = course.Activities
            .SelectMany(activity => activity.SolvedActivities)
            .Where(sa => studentIds.Contains(sa.UserId))
            .ToList();

        var latestSolvedActivities = allSolvedActivities
            .GroupBy(sa => new { sa.UserId, sa.ActivityId })
            .Select(group => group
                .OrderByDescending(sa => sa.UpdatedOn ?? sa.CreatedOn ?? DateTime.MinValue)
                .First()
            )
            .ToList();

        var completedStudents = latestSolvedActivities
            .GroupBy(sa => sa.UserId)
            .Where(group =>
            {
                var completedCount = group.Count(sa => sa.Status == SolvedActivityStatus.Completed);
                return completedCount == totalActivitiesCount;
            })
            .ToList();

        if (completedStudents.Count == 0)
        {
            return 0;
        }

        var totalGrades = completedStudents
            .SelectMany(group => group)
            .Sum(sa => sa.Grade);

        return Math.Round(totalGrades / (double)(totalActivitiesCount * completedStudents.Count), 2);
    }
}
