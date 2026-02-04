using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Application.DTOs.Document;
using UBBGradePortal.Application.DTOs.SolvedActivity;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Mappers;

public static class ActivityMapper
{
    public static ActivityDto FromActivityToActivityDto(
        Activity activity,
        List<SolvedActivityDto>? solvedActivities,
        List<DocumentDto>? activityDocuments
    )
    {
        return new ActivityDto
        {
            Id = activity.Id,
            Name = activity.Name,
            Description = activity.Description,
            CreatedOn = activity.CreatedOn,
            SolvedActivityStatus = solvedActivities?.Select(s => s.Status).FirstOrDefault(),
            NumberOfDocuments = activityDocuments?.Count,
            SolvedActivities = solvedActivities,
            Documents = activityDocuments,
        };
    }
}
