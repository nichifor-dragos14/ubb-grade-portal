using System.Reflection.Metadata;
using UBBGradePortal.WebApi.Development;

[assembly: MetadataUpdateHandler(typeof(HotReloadManager))]

namespace UBBGradePortal.WebApi.Development;

public static class HotReloadManager
{
    internal static SwaggerExportService SwaggerExportService { get; set; }

    public static void ClearCache(Type[]? updatedTypes)
    {
    }

    public static void UpdateApplication(Type[]? updatedTypes)
    {
        SwaggerExportService.StartAsync(CancellationToken.None);
    }
}