using System.Reflection.Metadata;
using UBBGradePortal.WebApi.Development;

[assembly: MetadataUpdateHandler(typeof(HotReloadManager))]

namespace UBBGradePortal.WebApi.Development;

public static class HotReloadManager
{
    internal static SwaggerExportService SwaggerExportService { get; set; } = default!;

    public static void ClearCache(Type[]? updatedTypes)
    {
    }

    public static void UpdateApplication(Type[]? updatedTypes)
    {
        _ = SwaggerExportService.StartAsync(CancellationToken.None);
    }
}