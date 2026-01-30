using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UBBGradePortal.Domain.Entities;

namespace UBBGradePortal.Infrastructure.EntityFramework.Configuration;

internal class SolvedActivityDocumentEntityConfiguration : IEntityTypeConfiguration<SolvedActivityDocument>
{
    public void Configure(EntityTypeBuilder<SolvedActivityDocument> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Bucket).IsRequired();
        builder.Property(u => u.Key).IsRequired();
        builder.Property(u => u.OriginalName);
        builder.Property(u => u.ContentType);
        builder.Property(u => u.SizeBytes);
        builder.Property(u => u.Etag);
        builder.Property(u => u.IsDeleted);

        builder.Property(u => u.CreatedOn);

        builder.HasOne(u => u.SolvedActivity).WithMany(c => c.SolvedActivityDocuments);
    }
}
