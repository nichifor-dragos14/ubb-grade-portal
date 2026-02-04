using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Application.DTOs.Document;
using UBBGradePortal.Application.DTOs.SolvedActivity;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Mappers;

public static class SolvedActivityMapper
{
    public static SolvedActivityDto FromSolvedActivityToSolvedActivityDto(
        SolvedActivity solvedActivity,
        ActivityDto? activity,
        List<DocumentDto>? solvedActivityDocuments
    )
    {
        return new SolvedActivityDto
        {
            Id = solvedActivity.Id,
            Status = solvedActivity.Status,
            Grade = solvedActivity.Grade,
            ProfessorComment = solvedActivity.ProfessorComment,
            CreatedOn = solvedActivity.CreatedOn,
            UpdatedOn = solvedActivity.UpdatedOn,
            SolvedByName = solvedActivity.User != null ? $"{solvedActivity.User.LastName} {solvedActivity?.User.FirstName}" : null,
            CourseName = solvedActivity?.Activity?.Course != null ? solvedActivity.Activity.Course.Name : null,
            Activity = activity,
            Documents = solvedActivityDocuments,
        };
    }
}
