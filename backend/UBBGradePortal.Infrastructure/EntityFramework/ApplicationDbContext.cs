using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using UBBGradePortal.Domain.Entities;
using UBBGradePortal.Infrastructure.Auth;

namespace UBBGradePortal.Infrastructure.EntityFramework;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Course> Courses { get; set; } = null!;
    public DbSet<CourseEnrollment> CourseEnrollments { get; set; } = null!;
    public DbSet<CourseDomain> CourseDomains { get; set; } = null!;
    public DbSet<Activity> Activities { get; set; } = null!;
    public DbSet<SolvedActivity> SolvedActivities { get; set; } = null!;
    public DbSet<ActivityDocument> ActivityDocuments { get; set; } = null!;
    public DbSet<SolvedActivityDocument> SolvedActivityDocuments { get; set; } = null!; 

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(GetType().Assembly);

        base.OnModelCreating(modelBuilder);
    }
}