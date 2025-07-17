using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace UBBGradePortal.Infrastructure.EntityFramework;

internal class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    ApplicationDbContext IDesignTimeDbContextFactory<ApplicationDbContext>.CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost:5432;Database=UBBGradePortal;Username=root;Password=root");

        ApplicationDbContext applicationContext = new(optionsBuilder.Options);

        return applicationContext;
    }
}