using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.EntityFramework.Configuration;

internal class ActivityEntityConfiguration : IEntityTypeConfiguration<Activity>
{
    public void Configure(EntityTypeBuilder<Activity> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name).IsRequired();
        builder.Property(u => u.Description);

        builder.Property(u => u.CreatedOn);
        builder.Property(u => u.UpdatedOn);

        builder.HasMany(u => u.SolvedActivities).WithOne(c => c.Activity);
        builder.HasOne(u => u.Course).WithMany(c => c.Activities);
    }
}
