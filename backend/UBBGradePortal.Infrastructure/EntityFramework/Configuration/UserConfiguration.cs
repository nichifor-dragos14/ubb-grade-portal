using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.EntityFramework.Configuration;


internal class UserEntityConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(q => q.Id);

        builder.Property(q => q.FirstName).IsRequired();
    }
}
