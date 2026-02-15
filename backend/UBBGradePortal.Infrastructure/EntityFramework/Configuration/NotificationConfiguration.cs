using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.EntityFramework.Configuration;

internal class NotificationEntityConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(notification => notification.Id);

        builder.Property(notification => notification.Message).IsRequired();
        builder.Property(notification => notification.CreatedOn).IsRequired();
        builder.Property(notification => notification.IsRead).HasDefaultValue(false);
        builder.Property(notification => notification.ReadOn);

        builder.HasOne(notification => notification.Receiver)
            .WithMany(user => user.Notifications)
            .HasForeignKey(notification => notification.ReceiverId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
