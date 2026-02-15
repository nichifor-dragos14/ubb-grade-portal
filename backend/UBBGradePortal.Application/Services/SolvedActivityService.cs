using Microsoft.Extensions.Logging;
using System.Diagnostics;
using UBBGradePortal.Application.Abstractions;
using UBBGradePortal.Application.DTOs.Ai;
using UBBGradePortal.Application.DTOs.Pagination;
using UBBGradePortal.Application.DTOs.SolvedActivity;
using UBBGradePortal.Application.DTOs.Notification;
using UBBGradePortal.Application.Exceptions;
using UBBGradePortal.Application.Mappers;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Abstractions;

namespace UBBGradePortal.Application.Services;

public class SolvedActivityService : ISolvedActivityService
{
    private readonly ICourseRepository _courseRepository;
    private readonly IActivityRepository _activityRepository;
    private readonly ISolvedActivityRepository _solvedActivityRepository;
    private readonly INotificationService _notificationService;
    private readonly IOpenAiService _genAiFeedbackService;
    private readonly ILogger<SolvedActivityService> _logger;

    public SolvedActivityService(
        ICourseRepository courseRepository,
        IActivityRepository activityRepository,
        ISolvedActivityRepository solvedActivityRepository,
        INotificationService notificationService,
        IOpenAiService genAiFeedbackService,
        ILogger<SolvedActivityService> logger
    )
    {
        _courseRepository = courseRepository;
        _activityRepository = activityRepository;
        _solvedActivityRepository = solvedActivityRepository;
        _notificationService = notificationService;
        _genAiFeedbackService = genAiFeedbackService;
        _logger = logger;
    }

    public async Task<PaginatedProfessorSolvedActivityDto> GetAllByStatusForProfessorCourses(int pageNumber, int pageSize, SolvedActivityStatusFilter status, string? studentName, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var statusFilter = status == SolvedActivityStatusFilter.All
            ? (SolvedActivityStatus?)null
            : (SolvedActivityStatus)status;

        var (Count, Activities) = await _solvedActivityRepository.GetAllByStatusForProfessorCourses(pageNumber, pageSize, statusFilter, studentName, loggedUserId, cancellationToken);

       

        return
            new PaginatedProfessorSolvedActivityDto(Count, Activities
                    .Select(solvedActivity => SolvedActivityMapper.FromSolvedActivityToSolvedActivityDto(
                        solvedActivity,
                        ActivityMapper.FromActivityToActivityDto(solvedActivity.Activity, null, null),
                        solvedActivity.SolvedActivityDocuments.Select(DocumentMapper.FromSolvedActivityDocumentToDocumentDto).ToList())
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

        return SolvedActivityMapper.FromSolvedActivityToSolvedActivityDto(
                        solvedActivity,
                        ActivityMapper.FromActivityToActivityDto(solvedActivity.Activity, null, solvedActivity.Activity.ActivityDocuments.Select(DocumentMapper.FromActivityDocumentToDocumentDto).ToList()),
                        solvedActivity.SolvedActivityDocuments.Select(DocumentMapper.FromSolvedActivityDocumentToDocumentDto).ToList()
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

        return SolvedActivityMapper.FromSolvedActivityToSolvedActivityDto(
                        solvedActivity,
                        ActivityMapper.FromActivityToActivityDto(solvedActivity.Activity, null, solvedActivity.Activity.ActivityDocuments.Select(DocumentMapper.FromActivityDocumentToDocumentDto).ToList()),
                        solvedActivity.SolvedActivityDocuments.Select(DocumentMapper.FromSolvedActivityDocumentToDocumentDto).ToList()
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

        if (activity.Course != null)
        {
            var pendingCount = await _solvedActivityRepository.CountSubmittedForCourse(
                activity.Course.Id,
                cancellationToken
            );

            if (pendingCount >= 5)
            {
                var message = $"There are {pendingCount} submissions waiting for your feedback for course '{activity.Course.Name}'";

                await _notificationService.Add(
                    new AddNotificationDto(activity.Course.CreatedByUserId, message, null,null),
                    cancellationToken
                );
            }
        }

        if (activity.Course == null)
        {
            _logger.LogInformation($"Cannot get Ai summary for {addSolvedActivityDto.ActivityId}");

            return solvedActivity.Id;
        }

        if (!activity.Course.AssistedLlmEvaluation)
        {
            _logger.LogInformation($"Assisted LLM evaluation is not enabled for {activity.Course.Id}");

            solvedActivity.AiDetectedSummary = null;
            solvedActivity.AiDetectedGoodPoints = null;
            solvedActivity.AiDetectedBadPoints = null;

            return solvedActivity.Id;
        }

        var aiSummary = await TryGenerateAiSummary(solvedActivityId, loggedUserId, cancellationToken);

        if (aiSummary == null)
        {
            return solvedActivity.Id;
        }

        solvedActivity.AiDetectedSummary = aiSummary.Summary;
        solvedActivity.AiDetectedGoodPoints = aiSummary.GoodPoints;
        solvedActivity.AiDetectedBadPoints = aiSummary.BadPoints;

        solvedActivityId = await _solvedActivityRepository.Update(solvedActivity, cancellationToken);

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

        var solvedActivityId = await _solvedActivityRepository.Update(solvedActivity, cancellationToken);

        if (solvedActivity.Activity?.Course != null)
        {
            var pendingCount = await _solvedActivityRepository.CountSubmittedForCourse(
                solvedActivity.Activity.CourseId,
                cancellationToken
            );

            if (pendingCount >= 5)
            {
                var message = $"There are {pendingCount} activities waiting for your feedback for course '{solvedActivity.Activity.Course.Name}'";

                await _notificationService.Add(
                    new AddNotificationDto(solvedActivity.Activity.Course.CreatedByUserId, message, null, null),
                    cancellationToken
                );
            }
        }

        if (solvedActivity.Status != SolvedActivityStatus.Submitted)
        {
            return solvedActivityId;
        }

        if (solvedActivity.Activity.Course == null)
        {
            _logger.LogInformation($"Cannot get Ai summary for {solvedActivity.ActivityId}");

            return solvedActivity.Id;
        }

        if (!solvedActivity.Activity.Course.AssistedLlmEvaluation)
        {
            _logger.LogInformation($"Assisted LLM evaluation is not enabled for {solvedActivity.Activity.Course.Id}");

            solvedActivity.AiDetectedSummary = null;
            solvedActivity.AiDetectedGoodPoints = null;
            solvedActivity.AiDetectedBadPoints = null;

            solvedActivityId = await _solvedActivityRepository.Update(solvedActivity, cancellationToken);

            return solvedActivity.Id;
        }

        var aiSummary = await TryGenerateAiSummary(solvedActivityId, loggedUserId, cancellationToken);

        if (aiSummary == null)
        {
            return solvedActivity.Id;
        }

        solvedActivity.AiDetectedSummary = aiSummary.Summary;
        solvedActivity.AiDetectedGoodPoints = aiSummary.GoodPoints;
        solvedActivity.AiDetectedBadPoints = aiSummary.BadPoints;

        solvedActivityId = await _solvedActivityRepository.Update(solvedActivity, cancellationToken);

        return solvedActivity.Id;
    }

    public async Task<Guid> GradeSolvedActivity(GradeSolvedActivityDto gradeSolvedActivityDto, Guid id, Guid loggedUserId, CancellationToken cancellationToken)
    {
        var solvedActivity = await _solvedActivityRepository.GetById(id, cancellationToken);

        if (solvedActivity == null)
        {
            _logger.LogInformation($"The solved activity {id} does not exist");

            throw new NotFoundException("The solved activity does not exist");
        }

        if (solvedActivity.Activity.Course.CreatedByUser.Id != loggedUserId)
        {
            _logger.LogInformation($"The user {loggedUserId} cannot grade the solved activity {id}");

            throw new ForbiddenException("You cannot grade this solved activity");
        }

        solvedActivity.Status = gradeSolvedActivityDto.Status;
        solvedActivity.ProfessorComment = gradeSolvedActivityDto.ProfessorComment;
        solvedActivity.Grade = gradeSolvedActivityDto.Grade;
        solvedActivity.UpdatedOn = DateTime.UtcNow;

        var solvedActivityId = await _solvedActivityRepository.Update(solvedActivity, cancellationToken);

        var activityName = solvedActivity.Activity?.Name ?? "this activity";
        var courseName = solvedActivity.Activity?.Course?.Name ?? "this course";
        var outcome = gradeSolvedActivityDto.Status == SolvedActivityStatus.Returned
            ? "returned"
            : "graded";
        var message = $"Your submission for '{activityName}' from course '{courseName}' was {outcome} by the professor";

        await _notificationService.Add(
            new AddNotificationDto(
                solvedActivity.UserId,
                message,
                solvedActivity.Activity?.CourseId,
                solvedActivity.ActivityId
            ),
            cancellationToken
        );

        return solvedActivityId;
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

    private async Task<OpenAiSolvedActivityFeedback?> TryGenerateAiSummary(Guid solvedActivityId, Guid loggedUserId, CancellationToken cancellationToken)
    {
        try
        {
            return await _genAiFeedbackService.GenerateSolvedActivitySummary(solvedActivityId, loggedUserId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI summary generation failed for solved activity {SolvedActivityId}", solvedActivityId);

            return null;
        }
    }
}
