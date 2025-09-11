using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.EntityFramework.Configuration;

internal class CourseEnrollmentConfiguration : IEntityTypeConfiguration<CourseEnrollment>
{
    public void Configure(EntityTypeBuilder<CourseEnrollment> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.CreatedOn);
        builder.Property(u => u.UpdatedOn);

        builder.HasOne(u => u.User).WithMany(c => c.CourseEnrollments);
        builder.HasOne(u => u.Course).WithMany(c => c.CourseEnrollments);
    }
}
