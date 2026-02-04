using Microsoft.Extensions.Logging;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Application.DTOs.Course;
using UBBGradePortal.Application.DTOs.SolvedActivity;
using UBBGradePortal.Application.Exceptions;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class CourseService : ICourseService
{
    private readonly ICourseRepository _courseRepository;
    private readonly ICourseDomainRepository _courseDomainRepository;
    private readonly ILogger<CourseService> _logger;
    
    public CourseService(
        ICourseRepository courseRepository,
        ICourseDomainRepository courseDomainRepository,
        ILogger<CourseService> logger
    )
    {
        _courseRepository = courseRepository;
        _courseDomainRepository = courseDomainRepository;
        _logger = logger;
    }

    public async Task<List<CourseDto>> GetAllByCourseDomainIds(List<Guid> courseDomainIds, CancellationToken cancellationToken)
    {
        var courses = await _courseRepository.GetAllByCourseDomainIds(courseDomainIds, cancellationToken);

        return courses
            .Select(c => new CourseDto(c.Id, c.Name, c.CourseDomain.Name))
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
                    .Select(c => new ProfessorCreatedCourseDto(
                        c.Id,
                        c.Name,
                        c.CourseDomain.Name,
                        c.CreatedOn,
                        c.CourseEnrollments.Count,
                        c.Activities.Count
                    ))
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
                    .Select(c => new StudentEnrollmentDto(
                        c.Course.Id,
                        c.Course.Name,
                        c.Course.CourseDomain.Name,
                        c.CreatedOn,
                        c.Course.Activities.Count,
                        c.User.SolvedActivities
                            .Where(s => c.Course.Activities.Select(a => a.Id).Contains(s.ActivityId))
                            .DistinctBy(s => s.ActivityId)
                            .Count()
                    ))
                    .ToList()
            );
    }

    public async Task<CourseDetailsDto?> GetById(Guid id, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(id, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation($"The course {id} is not available");

            throw new NotFoundException("The course does not exist");
        }

        return
            new CourseDetailsDto(
                course.Id,
                course.Name,
                course.Description,
                course.CourseDomain.Name,
                course.Activities
                    .OrderBy(c => c.CreatedOn)
                    .Select(
                        activity => new ActivityDto(
                            activity.Id,
                            activity.Name,
                            activity.Description,
                            activity.CreatedOn,
                            null,
                            activity.ActivityDocuments.Count,
                            [],
                            []
                        )
                    )
                    .ToList()
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

            throw new NotFoundException("You cannot update this course");
        }

        course.Description = updateCourseDto.Description;

        return await _courseRepository.Update(course, cancellationToken);
    }

    public async Task<CourseDetailsStudentDto?> GetByIdStudent(Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(id, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation($"The course {id} is not available");

            throw new NotFoundException("The course does not exist");
        }

        return
            new CourseDetailsStudentDto(
                course.Id,
                course.Name,
                course.Description,
                course.CourseDomain.Name,
                course.Activities
                    .OrderBy(c => c.CreatedOn)
                    .Select(
                        activity => new ActivityDto(
                            activity.Id,
                            activity.Name,
                            activity.Description,
                            activity.CreatedOn,
                            activity.SolvedActivities
                            .Where(sa => sa.User.Id == loggedUserId)
                            .OrderByDescending(sa => sa.CreatedOn)
                            .Select(sa => new SolvedActivityDto(
                                sa.Id,
                                sa.Status,
                                sa.Grade,
                                sa.ProfessorComment,
                                sa.CreatedOn,
                                sa.UpdatedOn,
                                null,
                                null,
                                null,
                                []
                                )
                            )
                            .FirstOrDefault()?.Status,
                            activity.ActivityDocuments.Count,
                            [],
                            []
                        )
                    )
                    .ToList()
            );
    }
}
