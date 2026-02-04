using Microsoft.Extensions.Logging;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Application.DTOs.Document;
using UBBGradePortal.Application.DTOs.SolvedActivity;
using UBBGradePortal.Application.Exceptions;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class SolvedActivityService : ISolvedActivityService
{
    private readonly ICourseRepository _courseRepository;
    private readonly IActivityRepository _activityRepository;
    private readonly ISolvedActivityRepository _solvedActivityRepository;
    private readonly ILogger<SolvedActivityService> _logger;

    public SolvedActivityService(
        ICourseRepository courseRepository,
        IActivityRepository activityRepository,
        ISolvedActivityRepository solvedActivityRepository,
        ILogger<SolvedActivityService> logger
    )
    {
        _courseRepository = courseRepository;
        _activityRepository = activityRepository;
        _solvedActivityRepository = solvedActivityRepository;
        _logger = logger;
    }

    public async Task<PaginatedProfessorSolvedActivityDto> GetAllByStatusForProfessorCourses(int pageNumber, int pageSize, SolvedActivityStatus status, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var (Count, Activities) = await _solvedActivityRepository.GetAllByStatusForProfessorCourses(pageNumber, pageSize, status, loggedUserId, cancellationToken);

        return
            new PaginatedProfessorSolvedActivityDto(Count, Activities
                    .Select(solvedActivity => new SolvedActivityDto(
                        solvedActivity.Id,
                        solvedActivity.Status,
                        solvedActivity.Grade,
                        solvedActivity.ProfessorComment,
                        solvedActivity.CreatedOn,
                        solvedActivity.UpdatedOn,
                        $"{solvedActivity.User?.LastName} {solvedActivity.User?.FirstName}".Trim(),
                        solvedActivity.Activity.Course.Name,
                        new ActivityDto(
                            solvedActivity.Activity.Id,
                            solvedActivity.Activity.Name,
                            solvedActivity.Activity.Description,
                            solvedActivity.CreatedOn,
                            null,
                            null,
                            [],
                            []
                        ),
                        [])
                    )
                    .ToList()
            );
    }

    public async Task<SolvedActivityDto?> GetById(Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var solvedActivity = await _solvedActivityRepository.GetById(id, cancellationToken);

        if (solvedActivity == null)
        {
            _logger.LogInformation($"The activity doesn't have any solved activity");

            throw new NotFoundException("The activity doesn't have any solved activity");
        }

        return
            new SolvedActivityDto(
                solvedActivity.Id,
                solvedActivity.Status,
                solvedActivity.Grade,
                solvedActivity.ProfessorComment,
                solvedActivity.CreatedOn,
                solvedActivity.UpdatedOn,
                null,
                null,
                new ActivityDto(
                    solvedActivity.Activity.Id,
                    solvedActivity.Activity.Name,
                    solvedActivity.Activity.Description,
                    solvedActivity.Activity.CreatedOn,
                    null,
                    solvedActivity.Activity.ActivityDocuments.Count,
                    solvedActivity.Activity.ActivityDocuments
                        .Select(d => new DocumentDto(d.Id, d.OriginalName, d.ContentType, d.SizeBytes, d.CreatedOn, d.Key, d.Bucket))
                        .ToList(),
                    []
                ),
                solvedActivity.SolvedActivityDocuments
                        .Select(d => new DocumentDto(d.Id, d.OriginalName, d.ContentType, d.SizeBytes, d.CreatedOn, d.Key, d.Bucket))
                        .ToList()
            );
    }

    public async Task<SolvedActivityDto?> GetLastByActivityId(Guid activityId, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetLastSubmissionById(activityId, loggedUserId, cancellationToken);

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
            new SolvedActivityDto(
                solvedActivity.Id,
                solvedActivity.Status,
                solvedActivity.Grade,
                solvedActivity.ProfessorComment,
                solvedActivity.CreatedOn,
                solvedActivity.UpdatedOn,
                null,
                null,
                new ActivityDto(
                    activity.Id,
                    activity.Name,
                    activity.Description,
                    activity.CreatedOn,
                    null,
                    activity.ActivityDocuments.Count,
                    activity.ActivityDocuments
                        .Select(d =>
                            new DocumentDto(
                                d.Id,
                                d.OriginalName,
                                d.ContentType,
                                d.SizeBytes,
                                d.CreatedOn,
                                d.Key,
                                d.Bucket
                            )
                        )
                        .ToList(),
                    []
                ),
                solvedActivity.SolvedActivityDocuments
                    .Select(d =>
                        new DocumentDto(
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

    public async Task<Guid> Add(AddSolvedActivityDto addSolvedActivityDto, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetById(addSolvedActivityDto.ActivityId, cancellationToken);

        if (activity == null)
        {
            _logger.LogInformation($"The activity {addSolvedActivityDto.ActivityId} is not available");

            throw new NotFoundException("The activity does not exist");
        }

        var courseEnrollments = await _courseRepository.GetAllStudentCourseEnrollments(loggedUserId, cancellationToken);

        if (!courseEnrollments.Select(ce => ce.CourseId).Contains(activity.CourseId))
        {
            _logger.LogInformation($"The user is not enrolled to {activity.CourseId}");

            throw new ForbiddenException("You are not enrolled to this course");
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

        solvedActivity.Id = await _solvedActivityRepository.Add(solvedActivity, cancellationToken);

        foreach (var document in addSolvedActivityDto.Documents)
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

            await _solvedActivityRepository.AddDocument(solvedActivityDocument, cancellationToken);
        }

        return solvedActivity.Id;
    }

    public async Task<Guid> Update(UpdateSolvedActivityDto updateSolvedActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var solvedActivity = await _solvedActivityRepository.GetById(id, cancellationToken);

        if (solvedActivity == null)
        {
            _logger.LogInformation($"The solved activity {id} does not exist");

            throw new NotFoundException("The solved activity does not exist");
        }

        if (solvedActivity.User.Id != loggedUserId)
        {
            _logger.LogInformation($"The user {loggedUserId} cannot update this solved activity {id}");

            throw new ForbiddenException("You cannot update this solved activity");
        }

        solvedActivity.UpdatedOn = DateTime.UtcNow;
        solvedActivity.Status = SolvedActivityStatus.Submitted;

        foreach (var document in updateSolvedActivityDto.Documents)
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

            await _solvedActivityRepository.AddDocument(solvedActivityDocument, cancellationToken);
        }

        return await _solvedActivityRepository.Update(solvedActivity, cancellationToken);
    }

    public async Task DeleteDocument(Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var solvedActivityDocument = await _solvedActivityRepository.GetDocument(id, cancellationToken);

        if (solvedActivityDocument == null)
        {
            _logger.LogInformation($"The solved activity document {id} does not exist");

            throw new NotFoundException("The solved activity document does not exist");
        }

        if (solvedActivityDocument.SolvedActivity.User.Id != loggedUserId)
        {
            _logger.LogInformation($"The user {loggedUserId} cannot delete the document {id}");

            throw new ForbiddenException("You cannot delete this document");
        }

        await _solvedActivityRepository.DeleteDocument(solvedActivityDocument, cancellationToken);
    }
}
