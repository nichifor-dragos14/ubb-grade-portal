using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.EntityFramework.Configuration;

internal class SolvedActivityEntityConfiguration : IEntityTypeConfiguration<SolvedActivity>
{
    public void Configure(EntityTypeBuilder<SolvedActivity> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.CreatedOn);
        builder.Property(u => u.UpdatedOn);

        builder.HasOne(u => u.User).WithMany(c => c.SolvedActivities);
        builder.HasOne(u => u.Activity).WithMany(c => c.SolvedActivities);
    }
}
