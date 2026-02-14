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

        var weeklySubmissions = BuildWeeklySubmissions(solvedActivitiesForEnrollments);

        return new StudentGeneralStatisticsDto
        {
            StudentName = string.Join(" ", new[] { user.FirstName, user.LastName }.Where(part => !string.IsNullOrWhiteSpace(part))),
            EnrolledCoursesCount = courses.Count,
            TotalCoursesCount = totalCoursesCount,
            SolvedActivitiesCount = solvedActivitiesCount,
            TotalActivitiesCount = totalActivitiesCount,
            DefaultCourseId = defaultCourseId,
            Courses = courseOptions,
            TopDomains = topDomains,
            WeeklySubmissions = weeklySubmissions
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

    public async Task<ProfessorGeneralStatisticsDto> GetProfessorGeneralStatistics(Guid loggedUserId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetById(loggedUserId, cancellationToken);

        if (user == null)
        {
            _logger.LogInformation("User {UserId} not found", loggedUserId);
            throw new NotFoundException("The user does not exist");
        }

        var courses = await _courseRepository.GetAllProfessorCreated(loggedUserId, cancellationToken);
        var totalCoursesCreated = courses.Count;
        var totalActivitiesCreated = courses.Sum(course => course.Activities.Count);

        var courseOptions = courses
            .Select(course => new ProfessorCourseOptionDto
            {
                Id = course.Id,
                Name = course.Name,
                ActivitiesCount = course.Activities.Count,
                SubmissionsCount = course.Activities.SelectMany(a => a.SolvedActivities).Count()
            })
            .OrderBy(course => course.Name)
            .ToList();

        Guid? defaultCourseId = null;

        if (courseOptions.Count != 0)
        {
            defaultCourseId = courseOptions
                .OrderByDescending(course => course.SubmissionsCount)
                .ThenBy(course => course.Name)
                .Select(course => course.Id)
                .FirstOrDefault();
        }

        var mostEnrolledCourses = courses
            .OrderByDescending(course => course.CourseEnrollments.Count)
            .ThenBy(course => course.Name)
            .Take(3)
            .Select(course => new ProfessorCoursePopularityDto
            {
                CourseId = course.Id,
                CourseName = course.Name,
                EnrolledCount = course.CourseEnrollments.Count
            })
            .ToList();

        var weeklySubmissions = BuildWeeklySubmissionsForProfessor(courses);

        return new ProfessorGeneralStatisticsDto
        {
            ProfessorName = string.Join(" ", new[] { user.FirstName, user.LastName }.Where(part => !string.IsNullOrWhiteSpace(part))),
            TotalCoursesCreated = totalCoursesCreated,
            TotalActivitiesCreated = totalActivitiesCreated,
            DefaultCourseId = defaultCourseId,
            Courses = courseOptions,
            MostEnrolledCourses = mostEnrolledCourses,
            WeeklySubmissions = weeklySubmissions
        };
    }

    public async Task<ProfessorCourseStatisticsDto> GetProfessorCourseStatistics(Guid courseId, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(courseId, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation("Course {CourseId} not found", courseId);
            throw new NotFoundException("The course does not exist");
        }

        if (course.CreatedByUserId != loggedUserId)
        {
            _logger.LogInformation("User {UserId} is not owner of course {CourseId}", loggedUserId, courseId);
            throw new ForbiddenException("Not allowed to access this course");
        }

        var totalActivitiesCount = course.Activities.Count;
        var enrolledStudentIds = course.CourseEnrollments.Select(e => e.UserId).Distinct().ToList();
        var enrolledStudentsCount = enrolledStudentIds.Count;

        var latestByStudentAndActivity = course.Activities
            .SelectMany(activity => activity.SolvedActivities
                .Where(sa => enrolledStudentIds.Contains(sa.UserId))
                .GroupBy(sa => sa.UserId)
                .Select(group => group
                    .OrderByDescending(sa => sa.UpdatedOn ?? sa.CreatedOn ?? DateTime.MinValue)
                    .First())
                .Select(sa => new { ActivityId = activity.Id, SolvedActivity = sa }))
            .ToList();

        var completedStudents = enrolledStudentIds
            .Where(studentId =>
            {
                var completedCount = latestByStudentAndActivity
                    .Where(item => item.SolvedActivity.UserId == studentId)
                    .Count(item => item.SolvedActivity.Status == SolvedActivityStatus.Completed);
                return totalActivitiesCount > 0 && completedCount == totalActivitiesCount;
            })
            .ToList();

        var studentsCompletedCount = completedStudents.Count;
        var completionPercentage = enrolledStudentsCount == 0 || totalActivitiesCount == 0
            ? 0
            : Math.Round((double)studentsCompletedCount * 100 / enrolledStudentsCount, 2);

        var averageGrade = 0d;

        if (studentsCompletedCount > 0 && totalActivitiesCount > 0)
        {
            var completedStudentGrades = latestByStudentAndActivity
                .Where(item => completedStudents.Contains(item.SolvedActivity.UserId))
                .Sum(item => item.SolvedActivity.Grade);

            averageGrade = Math.Round(completedStudentGrades / (double)(studentsCompletedCount * totalActivitiesCount), 2);
        }

        var activityStats = course.Activities
            .Select(activity =>
            {
                var latestForActivity = activity.SolvedActivities
                    .Where(sa => enrolledStudentIds.Contains(sa.UserId))
                    .GroupBy(sa => sa.UserId)
                    .Select(group => group
                        .OrderByDescending(sa => sa.UpdatedOn ?? sa.CreatedOn ?? DateTime.MinValue)
                        .First())
                    .ToList();

                var submissionCount = latestForActivity.Count(sa =>
                    sa.Status == SolvedActivityStatus.Submitted ||
                    sa.Status == SolvedActivityStatus.Completed ||
                    sa.Status == SolvedActivityStatus.Returned);

                var completedForActivity = latestForActivity
                    .Where(sa => sa.Status == SolvedActivityStatus.Completed)
                    .ToList();

                var avgGrade = completedForActivity.Count == 0
                    ? 0
                    : Math.Round(completedForActivity.Sum(sa => sa.Grade) / (double)completedForActivity.Count, 2);

                return new
                {
                    SubmissionCount = submissionCount,
                    Stat = new ProfessorActivityStatDto
                    {
                        ActivityId = activity.Id,
                        ActivityName = activity.Name,
                        CompletedCount = completedForActivity.Count,
                        AverageGrade = avgGrade
                    }
                };
            })
            .ToList();

        var leastSolvedActivity = activityStats
            .OrderBy(stat => stat.SubmissionCount)
            .ThenBy(stat => stat.Stat.ActivityName)
            .FirstOrDefault();

        var orderedActivityStats = activityStats
            .Select(stat => stat.Stat)
            .OrderByDescending(stat => stat.CompletedCount)
            .ThenBy(stat => stat.ActivityName)
            .ToList();

        return new ProfessorCourseStatisticsDto
        {
            CourseId = course.Id,
            CourseName = course.Name,
            TotalActivitiesCount = totalActivitiesCount,
            EnrolledStudentsCount = enrolledStudentsCount,
            StudentsCompletedCount = studentsCompletedCount,
            CompletionPercentage = completionPercentage,
            AverageGrade = averageGrade,
            LeastSolvedActivityId = leastSolvedActivity?.Stat.ActivityId,
            LeastSolvedActivityName = leastSolvedActivity?.Stat.ActivityName,
            LeastSolvedActivitySubmissions = leastSolvedActivity?.SubmissionCount ?? 0,
            ActivityStats = orderedActivityStats
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

    private static List<WeeklySubmissionDto> BuildWeeklySubmissions(List<SolvedActivity> solvedActivities)
    {
        var now = DateTime.UtcNow.Date;
        var currentWeekStart = GetWeekStart(now);
        var firstWeekStart = currentWeekStart.AddDays(-7 * 11);

        var activityCounts = solvedActivities
            .Where(sa => sa.CreatedOn.HasValue)
            .Select(sa => new
            {
                WeekStart = GetWeekStart(sa.CreatedOn!.Value.Date),
                sa.ActivityId
            })
            .Where(item => item.WeekStart >= firstWeekStart && item.WeekStart <= currentWeekStart)
            .GroupBy(item => item.WeekStart)
            .ToDictionary(
                group => group.Key,
                group => group.Select(item => item.ActivityId).Distinct().Count()
            );

        var result = new List<WeeklySubmissionDto>();

        for (var i = 11; i >= 0; i -= 1)
        {
            var weekStart = currentWeekStart.AddDays(-7 * i);
            activityCounts.TryGetValue(weekStart, out var count);

            result.Add(new WeeklySubmissionDto
            {
                WeekStart = weekStart,
                Count = count
            });
        }

        return result;
    }

    private static List<WeeklySubmissionDto> BuildWeeklySubmissionsForProfessor(List<Course> courses)
    {
        var solvedActivities = courses
            .SelectMany(course => course.Activities)
            .SelectMany(activity => activity.SolvedActivities)
            .ToList();

        var now = DateTime.UtcNow.Date;
        var currentWeekStart = GetWeekStart(now);
        var firstWeekStart = currentWeekStart.AddDays(-7 * 11);

        var submissionCounts = solvedActivities
            .Where(sa => sa.CreatedOn.HasValue || sa.UpdatedOn.HasValue)
            .Select(sa => new
            {
                WeekStart = GetWeekStart((sa.CreatedOn ?? sa.UpdatedOn)!.Value.Date)
            })
            .Where(item => item.WeekStart >= firstWeekStart && item.WeekStart <= currentWeekStart)
            .GroupBy(item => item.WeekStart)
            .ToDictionary(group => group.Key, group => group.Count());

        var result = new List<WeeklySubmissionDto>();

        for (var i = 11; i >= 0; i -= 1)
        {
            var weekStart = currentWeekStart.AddDays(-7 * i);
            submissionCounts.TryGetValue(weekStart, out var count);

            result.Add(new WeeklySubmissionDto
            {
                WeekStart = weekStart,
                Count = count
            });
        }

        return result;
    }

    private static DateTime GetWeekStart(DateTime date)
    {
        var diff = (7 + (int)date.DayOfWeek - (int)DayOfWeek.Monday) % 7;
        return date.AddDays(-diff).Date;
    }
}
