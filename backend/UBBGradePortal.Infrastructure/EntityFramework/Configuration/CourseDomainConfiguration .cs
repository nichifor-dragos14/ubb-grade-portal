using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.EntityFramework.Configuration;

internal class CourseDomainEntityConfiguration : IEntityTypeConfiguration<CourseDomain>
{
    public void Configure(EntityTypeBuilder<CourseDomain> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name).IsRequired();

        builder.Property(u => u.CreatedOn);
        builder.Property(u => u.UpdatedOn);

        builder.HasMany(u => u.Courses).WithOne(c => c.CourseDomain);
    }
}
