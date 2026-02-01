using Microsoft.Extensions.Logging;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Application.Exceptions;
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
            _logger.LogInformation($"The course {courseId} is not available");

            throw new NotFoundException("The course does not exist");
        }

        var activities = await _activityRepository.GetAllByCourseId(courseId, cancellationToken);

        return activities
            .Select(c => new ActivityDto(c.Id, c.Name, c.Description, c.ActivityDocuments.Count, c.CreatedOn))
            .ToList();
    }

    public async Task<ActivityDetailsDto?> GetById(Guid id, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetById(id, cancellationToken);

        if (activity == null)
        {
            _logger.LogInformation($"The activity {id} does not exist");

            throw new NotFoundException("The activity does not exist");
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

    public async Task<Guid> Add(AddActivityDto addActivityDto, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var course = await _courseRepository.GetById(addActivityDto.CourseId, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation($"The course {addActivityDto.CourseId} is not available");

            throw new NotFoundException("The course does not exist");
        }

        if (loggedUserId != course.CreatedByUserId)
        {
            _logger.LogInformation($"The user {loggedUserId} cannot add an activity to course {addActivityDto.CourseId}");

            throw new NotFoundException("You cannot add activities to this course");
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

    public async Task<Guid> Update(UpdateActivityDto updateActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetById(id, cancellationToken);

        if (activity == null)
        {
            _logger.LogInformation($"The activity {id} does not exist");

            throw new NotFoundException("The activity does not exist");
        }

        var course = await _courseRepository.GetById(activity.Course.Id, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation($"The activity {id} is not linked to an available course");

            throw new NotFoundException("The activity is not linked to an available course");
        }

        if (loggedUserId != course.CreatedByUserId)
        {
            _logger.LogInformation($"The user {loggedUserId} cannot update the activity {id}");

            throw new NotFoundException("You cannot update this activity");
        }

        activity.Description = updateActivityDto.Description;
        activity.UpdatedOn = DateTime.UtcNow;

        return await _activityRepository.Update(activity, cancellationToken);
    }

    public async Task<Guid> AddDocument(AddActivityDocumentDto addActivityDocumentDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetById(id, cancellationToken);

        if (activity == null)
        {
            _logger.LogInformation($"The activity {id} does not exist");

            throw new NotFoundException("The activity does not exist");
        }

        var course = await _courseRepository.GetById(activity.CourseId, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation($"The activity {id} is not linked to an available course");

            throw new NotFoundException("The activity is not linked to an available course");
        }

        if (loggedUserId != course.CreatedByUserId)
        {
            _logger.LogInformation($"The user {loggedUserId} cannot update the activity {id}");

            throw new NotFoundException("You cannot update this activity");
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
            ActivityId = activity.Id,
        };

        return await _activityRepository.AddDocument(activityDocument, cancellationToken);
    }

    public async Task DeleteDocument(Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var activityDocument = await _activityRepository.GetDocument(id, cancellationToken);

        if (activityDocument == null)
        {
            _logger.LogInformation($"The document {id} does not exist");

            throw new NotFoundException("The document does not exist");
        }

        var activity = await _activityRepository.GetById(activityDocument.ActivityId, cancellationToken);

        if (activity == null)
        {
            _logger.LogInformation($"The document {id} is not linked to an available activity");

            throw new NotFoundException("The document is not linked to an available activity");
        }

        var course = await _courseRepository.GetById(activity.CourseId, cancellationToken);

        if (course == null)
        {
            _logger.LogInformation($"The activity {activityDocument.ActivityId} is not linked to an available course");

            throw new NotFoundException("The activity is not linked to an available course");
        }

        if (loggedUserId != course.CreatedByUserId)
        {
            _logger.LogInformation($"The user {loggedUserId} cannot update the activity {id}");

            throw new NotFoundException("You cannot delete this document");
        }

        await _activityRepository.DeleteDocument(activityDocument, cancellationToken);
    }

    public async Task<SolvedActivityDetailsDto?> GetActivityLastSolvedActivity(Guid activityId, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetActivityLastSolvedActivity(activityId, loggedUserId, cancellationToken);

        if (activity == null)
        {
            _logger.LogInformation($"The activity {activityId} does not exist");

            throw new NotFoundException("The activity does not exist");
        }

        var solvedActivity = activity.SolvedActivities.FirstOrDefault();

        if (solvedActivity == null)
        {
            _logger.LogInformation($"The activity doesn't have any solved activity");

            throw new NotFoundException("The activity doesn't have any solved activity");
        }

        return
            new SolvedActivityDetailsDto(
                solvedActivity.Id,
                solvedActivity.Status,
                solvedActivity.Grade,
                solvedActivity.ProfessorComment,
                solvedActivity.CreatedOn,
                solvedActivity.UpdatedOn,
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
                ),
                solvedActivity.SolvedActivityDocuments
                        .Select(d =>
                            new SolvedActivityDocumentDto(
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

    public async Task<Guid> AddSolvedActivity(AddSolvedActivityDto addSolvedActivityDto, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetById(addSolvedActivityDto.ActivityId, cancellationToken);

        if (activity == null)
        {
            _logger.LogInformation($"The activity {addSolvedActivityDto.ActivityId} is not available");

            throw new NotFoundException("The activity does not exist");
        }

        var creationDate = DateTime.UtcNow;
        var solvedActivityId = Guid.NewGuid();

        var solvedActivity = new SolvedActivity
        {
            Id = solvedActivityId,
            Status = SolvedActivityStatus.Submitted,
            UserId = loggedUserId,
            ActivityId = activity.Id,
            CreatedOn = creationDate,
            UpdatedOn = creationDate,
        };
        
        solvedActivity.Id = await _activityRepository.AddSolvedActivity(solvedActivity, cancellationToken);

        foreach (var document in addSolvedActivityDto.SolvedActivityDocuments)
        {
            var solvedActivityDocumentId = Guid.NewGuid();

            var solvedActivityDocument = new SolvedActivityDocument
            {
                Id = solvedActivityDocumentId,
                Key = document.Key,
                OriginalName = document.OriginalName,
                ContentType = document.ContentType,
                SizeBytes = document.SizeBytes,
                Bucket = document.Bucket,
                Etag = document.Etag,
                IsDeleted = false,
                CreatedOn = DateTime.UtcNow,
                SolvedActivityId = solvedActivity.Id,
            };

            await _activityRepository.AddSolvedActivityDocument(solvedActivityDocument, cancellationToken);
        }

        return solvedActivity.Id;
    }

    public async Task<Guid> UpdateSolvedActivity(UpdateSolvedActivityDto updateSolvedActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var solvedActivity = await _activityRepository.GetSolvedActivityById(id, cancellationToken);

        if (solvedActivity == null)
        {
            _logger.LogInformation($"The solved activity {id} does not exist");

            throw new NotFoundException("The solved activity does not exist");
        }

        solvedActivity.UpdatedOn = DateTime.UtcNow;
        solvedActivity.Status = SolvedActivityStatus.Submitted;

        foreach (var document in updateSolvedActivityDto.SolvedActivityDocuments)
        {
            var solvedActivityDocumentId = Guid.NewGuid();

            var solvedActivityDocument = new SolvedActivityDocument
            {
                Id = solvedActivityDocumentId,
                Key = document.Key,
                OriginalName = document.OriginalName,
                ContentType = document.ContentType,
                SizeBytes = document.SizeBytes,
                Bucket = document.Bucket,
                Etag = document.Etag,
                IsDeleted = false,
                CreatedOn = DateTime.UtcNow,
                SolvedActivityId = solvedActivity.Id,
            };

            await _activityRepository.AddSolvedActivityDocument(solvedActivityDocument, cancellationToken);
        }

        return await _activityRepository.UpdateSolvedActivity(solvedActivity, cancellationToken);
    }

    public async Task DeleteSolvedActivityDocument(Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var solvedActivityDocument = await _activityRepository.GetSolvedActivityDocument(id, cancellationToken);

        if (solvedActivityDocument == null)
        {
            _logger.LogInformation($"The solved activity document {id} does not exist");

            throw new NotFoundException("The solved activity document does not exist");
        }

        await _activityRepository.DeleteSolvedActivityDocument(solvedActivityDocument, cancellationToken);
    }
}
