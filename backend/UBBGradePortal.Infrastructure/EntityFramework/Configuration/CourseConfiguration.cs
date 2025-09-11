using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.EntityFramework.Configuration;

internal class CourseEntityConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name).IsRequired();
        builder.Property(u => u.Description);

        builder.Property(u => u.CreatedOn);
        builder.Property(u => u.UpdatedOn);

        builder.HasMany(u => u.Activities).WithOne(c => c.Course);
        builder.HasMany(u => u.CourseEnrollments).WithOne(c => c.Course);
        builder.HasOne(u => u.CourseDomain).WithMany(c => c.Courses);
        builder.HasOne(u => u.CreatedByUser).WithMany(c => c.CreatedCourses);
    }
}
