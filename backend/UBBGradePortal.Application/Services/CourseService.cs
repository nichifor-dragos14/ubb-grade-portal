using Microsoft.Extensions.Logging;
using System.Diagnostics;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Course;
using UBBGradePortal.Application.DTOs.CourseDomain;
using UBBGradePortal.Application.DTOs.Pagination;
using UBBGradePortal.Application.Exceptions;
using UBBGradePortal.Application.Mappers;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class CourseService : ICourseService
{
    private readonly ICourseRepository _courseRepository;
    private readonly ICourseDomainRepository _courseDomainRepository;
    private readonly ICourseEnrollmentRepository _courseEnrollmentRepository;
    private readonly ILogger<CourseService> _logger;

    public CourseService(
        ICourseRepository courseRepository,
        ICourseDomainRepository courseDomainRepository,
        ICourseEnrollmentRepository courseEnrollmentRepository,
        ILogger<CourseService> logger
    )
    {
        _courseRepository = courseRepository;
        _courseDomainRepository = courseDomainRepository;
        _courseEnrollmentRepository = courseEnrollmentRepository;
        _logger = logger;
    }

    public async Task<List<CourseDto>> GetAllByCourseDomainIds(List<Guid> courseDomainIds, CancellationToken cancellationToken)
    {
        var courses = await _courseRepository.GetAllByCourseDomainIds(courseDomainIds, cancellationToken);

        return courses
            .Select(c => CourseMapper.FromCourseToCourseDto(c, null, null))
            .ToList();
    }

    public async Task<List<CourseDomainDto>> GetAllCourseDomains(CancellationToken cancellationToken)
    {
        var courseDomains = await _courseDomainRepository.GetAll(cancellationToken);

        return courseDomains
            .Select(c => new CourseDomainDto(c.Id, c.Name))
            .ToList();
    }

    public async Task<PaginatedProfessorCreatedCourseDto> GetAllProfessorCreated(int pageNumber, int pageSize, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var (Count, Courses) = await _courseRepository.GetAllProfessorCreated(pageNumber, pageSize, loggedUserId, cancellationToken);

        return
            new PaginatedProfessorCreatedCourseDto(
                Count,
                Courses
                    .Select(course => CourseMapper.FromCourseToCourseDto(
                        course,
                        course.Activities.Select(activity => ActivityMapper.FromActivityToActivityDto(activity, null, null)).ToList(),
                        null)
                    )
                    .ToList()
            );
    }

    public async Task<PaginatedStudentCourseEnrollmentDto> GetAllStudentCourseEnrollments(int pageNumber, int pageSize, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var (Count, Courses) = await _courseRepository.GetAllStudentCourseEnrollments(pageNumber, pageSize, loggedUserId, cancellationToken);

        return
            new PaginatedStudentCourseEnrollmentDto(
                Count,
                Courses
                    .Select(course => CourseMapper.FromCourseToCourseDto(
                                    course.Course,
                                    course.Course.Activities.Select(a => ActivityMapper.FromActivityToActivityDto(a, null, null)).ToList(),
                                    course.User.SolvedActivities
                                        .Where(s => s.Status == SolvedActivityStatus.Completed && course.Course.Activities.Select(a => a.Id).Contains(s.ActivityId))
                                        .DistinctBy(s => s.ActivityId)
                                        .ToList()
                                    )
                    )
                    .ToList()
            );
    }

    public async Task<List<CourseDto>> GetAllStudentCoursesByRecommendationOrSearchString(string? searchString, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var enrollments = await _courseEnrollmentRepository.GetAllByUserId(loggedUserId, cancellationToken);

        if (String.IsNullOrEmpty(searchString))
        {
            var courseDomainIds = enrollments.Select(e => e.Course.CourseDomainId).ToList();
            var courseRecommendations = await _courseRepository.GetAllByCourseDomainIds(courseDomainIds, cancellationToken);

            return courseRecommendations
                .Where(course => !enrollments.Select(e => e.CourseId).Contains(course.Id))
                .Select(course => CourseMapper.FromCourseToCourseDto(
                    course,
                    course.Activities.Select(activity => ActivityMapper.FromActivityToActivityDto(activity, null, null)).ToList(),
                    null)
                )
                .Take(10)
                .ToList();
        }

        var filteredCourses = await _courseRepository.GetAllBySearchString(searchString, cancellationToken);

        return filteredCourses
                .Where(course => !enrollments.Select(e => e.CourseId).Contains(course.Id))
                .Select(course => CourseMapper.FromCourseToCourseDto(
                    course,
                    course.Activities.Select(activity => ActivityMapper.FromActivityToActivityDto(activity, null, null)).ToList(),
                    null)
                )
                .Take(10)
                .ToList();
    }

    public async Task<CourseDto?> GetById(Guid id, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(id, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation($"The course {id} is not available");

            throw new NotFoundException("The course does not exist");
        }

        return CourseMapper.FromCourseToCourseDto(
            course,
            course.Activities.OrderByDescending(activity => activity.CreatedOn).Select(activity => ActivityMapper.FromActivityToActivityDto(
                activity,
                null,
                activity.ActivityDocuments.Select(activityDocument => DocumentMapper.FromActivityDocumentToDocumentDto(activityDocument)).ToList())
            ).ToList(),
            null
        );
    }

    public async Task<CourseDto?> GetByIdStudent(Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(id, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation($"The course {id} is not available");

            throw new NotFoundException("The course does not exist");
        }

        course.Activities.ForEach(activity => activity.SolvedActivities = activity.SolvedActivities
            .OrderByDescending(sa => sa.CreatedOn)
            .Where(sa => sa.User.Id == loggedUserId)
            .ToList()
        );

        return CourseMapper.FromCourseToCourseDto(
            course,
            course.Activities
                    .OrderBy(activity => activity.CreatedOn)
                    .Select(activity => ActivityMapper.FromActivityToActivityDto(
                        activity,
                        activity.SolvedActivities.Select(solvedActivity => SolvedActivityMapper.FromSolvedActivityToSolvedActivityDto(solvedActivity, null, null)).ToList(),
                        activity.ActivityDocuments.Select(activityDocument => DocumentMapper.FromActivityDocumentToDocumentDto(activityDocument)).ToList()
                    )
                ).ToList(),
            null
        );
    }

    public async Task<Guid> Add(AddCourseDto addCourseDto, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var courseDomain = await _courseDomainRepository.GetById(addCourseDto.CourseDomainId, cancellationToken);

        if (courseDomain == null)
        {
            _logger.LogInformation($"The course domain {addCourseDto.CourseDomainId} does not exist");

            throw new NotFoundException("The course domain does not exist");
        }

        var courseId = Guid.NewGuid();

        var course = new Course
        {
            Id = courseId,
            Name = addCourseDto.Name,
            Description = addCourseDto.Description,
            CreatedByUserId = loggedUserId,
            CourseDomainId = courseDomain.Id,
            CreatedOn = DateTime.UtcNow,
            UpdatedOn = DateTime.UtcNow,
        };

        return await _courseRepository.Add(course, cancellationToken);
    }

    public async Task<Guid> Update(UpdateCourseDto updateCourseDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(id, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation($"The course {id} does not exist");

            throw new NotFoundException("The course does not exist");
        }


        if (loggedUserId != course.CreatedByUserId)
        {
            _logger.LogInformation($"The user {loggedUserId} cannot update the course {course.Id}");

            throw new ForbiddenException("You cannot update this course");
        }

        course.Description = updateCourseDto.Description;

        return await _courseRepository.Update(course, cancellationToken);
    }

    public async Task<bool> EnrollToCourse(Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var enrollments = await _courseEnrollmentRepository.GetAllByUserId(loggedUserId, cancellationToken);

        if (enrollments.Select(e => e.CourseId).Contains(id))
        {
            _logger.LogInformation($"The user {loggedUserId} is already enrolled to course {id}");

            throw new ForbiddenException("You already enrolled for this course");
        }

        var enrollment = new CourseEnrollment
        {
            Id = Guid.NewGuid(),
            CourseId = id,
            UserId = loggedUserId,
            CreatedOn = DateTime.UtcNow,
            UpdatedOn = DateTime.UtcNow,
        };

        return await _courseEnrollmentRepository.Add([enrollment], cancellationToken);
    }
}
