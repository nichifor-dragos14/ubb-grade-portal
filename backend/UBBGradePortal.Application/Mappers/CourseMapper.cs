using UBBGradePortal.Application.DTOs.Activity;
using UBBGradePortal.Application.DTOs.Course;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Application.Mappers;

public static class CourseMapper
{
    public static CourseDto FromCourseToCourseDto(
        Course course,
        List<ActivityDto>? activities,
        List<SolvedActivity>? solvedActivities
    )
    {
        return new CourseDto
        {
            Id = course.Id,
            Name = course.Name,
            Description = course?.Description,
            CourseDomainName = course?.CourseDomain.Name,
            CourseDomainId = course?.CourseDomain.Id,
            AssistedLlmEvaluation = course?.AssistedLlmEvaluation,
            CreatedOn = course?.CreatedOn,
            NumberOfEntrollments = course?.CourseEnrollments?.Count,
            NumberOfActivities = activities?.Count,
            NumberOfSolvedActivities = solvedActivities?.Count,
            Activities = activities,
        };
    }
}
