using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.EntityFramework.Configuration;

internal class BadgeEntityConfiguration : IEntityTypeConfiguration<Badge>
{
    public void Configure(EntityTypeBuilder<Badge> builder)
    {
        builder.HasKey(badge => badge.Id);

        builder.Property(badge => badge.CreatedOn).IsRequired();
        builder.Property(badge => badge.Month).IsRequired();
        builder.Property(badge => badge.Message).IsRequired();
        builder.Property(badge => badge.Position).IsRequired();

        builder.HasOne(badge => badge.User)
            .WithMany(user => user.Badges)
            .HasForeignKey(badge => badge.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
