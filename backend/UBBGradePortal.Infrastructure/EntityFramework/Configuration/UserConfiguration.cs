using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Auth;

namespace UBBGradePortal.Infrastructure.EntityFramework.Configuration;

internal class UserEntityConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.FirstName).IsRequired();
        builder.Property(u => u.LastName).IsRequired();
        builder.Property(u => u.Email).IsRequired();

        builder.Property(u => u.Role).IsRequired();

        builder.Property(u => u.CreatedOn);
        builder.Property(u => u.UpdatedOn);

        builder.HasMany(u => u.CreatedCourses).WithOne(c => c.CreatedByUser);
        builder.HasMany(u => u.CourseEnrollments).WithOne(c => c.User);
        builder.HasMany(u => u.SolvedActivities).WithOne(c => c.User);
        builder.HasMany(u => u.Notifications).WithOne(n => n.Receiver);

        builder.HasOne<ApplicationUser>()
              .WithOne()
              .HasForeignKey<User>(x => x.Id)
              .OnDelete(DeleteBehavior.Cascade);
    }
}
