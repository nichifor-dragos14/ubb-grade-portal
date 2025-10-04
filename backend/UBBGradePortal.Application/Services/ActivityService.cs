using Microsoft.Extensions.Logging;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class ActivityService : IActivityService
{
    private readonly ICourseRepository _courseRepository;
    private readonly IActivityRepository _activityRepository;
    private readonly ILogger<ActivityService> _logger;

    public ActivityService(
        ICourseRepository courseRepository,
        IActivityRepository activityRepository,
        ILogger<ActivityService> logger
    )
    {
        _courseRepository = courseRepository;
        _activityRepository = activityRepository;
        _logger = logger;
    }

    public async Task<List<ActivityDto>> GetAllByCourseId(Guid courseId, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(courseId, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation("The course is not available");

            throw new Exception("The course is not available");
        }

        var activities = await _activityRepository.GetAllByCourseId(courseId, cancellationToken);

        return activities
            .Select(c => new ActivityDto(c.Id, c.Name, c.Description))
            .ToList();
    }

    public async Task<ActivityDetailsDto?> GetById(Guid id, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetById(id, cancellationToken);

        if (activity == null)
        {
            _logger.LogInformation("The activity is not available");

            return null;
        }

        return
            new ActivityDetailsDto(
                activity.Id,
                activity.Name,
                activity.Description,
                activity.ActivityDocuments
                    .Select(d =>
                        new ActivityDocumentDto(
                            d.Id,
                            d.OriginalName,
                            d.ContentType,
                            d.SizeBytes,
                            d.CreatedOn,
                            d.Key,
                            d.Bucket
                        )
                    )
                    .ToList()
            );
    }

    public async Task<bool> Add(AddActivityDto addActivityDto, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(addActivityDto.CourseId, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation("The course is not available");

            return false;
        }

        if (loggedUserId != course.CreatedByUserId)
        {
            _logger.LogInformation("The user cannot update this activity");

            return false;
        }

        var activityId = Guid.NewGuid();

        var activity = new Activity
        {
            Id = activityId,
            Name = addActivityDto.Name,
            Description = addActivityDto.Description,
            CreatedOn = DateTime.UtcNow,
            UpdatedOn = DateTime.UtcNow,
            CourseId = course.Id,
        };

        return await _activityRepository.Add(activity, cancellationToken);
    }

    public async Task<bool> Update(UpdateActivityDto updateActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetById(id, cancellationToken);

        if (activity == null)
        {
            _logger.LogInformation("The activity is not available");

            return false;
        }

        var course = await _courseRepository.GetById(activity.CourseId, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation("The activity is not linked to an available course");

            return false;
        }

        if (loggedUserId != course.CreatedByUserId)
        {
            _logger.LogInformation("The user cannot update this activity");

            return false;
        }

        activity.Description = updateActivityDto.Description;
        activity.UpdatedOn = DateTime.UtcNow;

        return await _activityRepository.Update(activity, cancellationToken);
    }

    public async Task<bool> AddDocument(AddActivityDocumentDto addActivityDocumentDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetById(id, cancellationToken);

        if (activity == null)
        {
            _logger.LogInformation("The activity is not available");

            return false;
        }

        var course = await _courseRepository.GetById(activity.CourseId, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation("The activity is not linked to an available course");

            return false;
        }

        if (loggedUserId != course.CreatedByUserId)
        {
            _logger.LogInformation("The user cannot update this activity");

            return false;
        }

        var documentActivityId = Guid.NewGuid();

        var activityDocument = new ActivityDocument
        {
            Id = documentActivityId,
            Key = addActivityDocumentDto.Key,
            OriginalName = addActivityDocumentDto.OriginalName,
            ContentType = addActivityDocumentDto.ContentType,
            SizeBytes = addActivityDocumentDto.SizeBytes,
            Bucket = addActivityDocumentDto.Bucket,
            Etag = addActivityDocumentDto.Etag,
            IsDeleted = false,
            CreatedOn = DateTime.UtcNow,
        };

        return await _activityRepository.AddDocument(activityDocument, cancellationToken);
    }
}
