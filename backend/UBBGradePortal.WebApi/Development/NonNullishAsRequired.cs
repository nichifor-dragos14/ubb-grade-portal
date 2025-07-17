using System.Reflection;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace UBBGradePortal.WebApi.Development;

internal class NonNullishAsRequiredSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema.Properties == null)
        {
            return;
        }

        FixNullableProperties(schema, context);

        var notNullableProperties = schema
            .Properties
            .Where(x => !x.Value.Nullable && x.Value.Default == default && !schema.Required.Contains(x.Key))
            .ToList();

        foreach (var property in notNullableProperties)
        {
            schema.Required.Add(property.Key);
        }
    }

    private static void FixNullableProperties(OpenApiSchema schema, SchemaFilterContext context)
    {
        foreach (var property in schema.Properties)
        {
            if (property.Value.Reference == null)
            {
                continue;
            }

            var field = context.Type
                .GetMembers(BindingFlags.Public | BindingFlags.Instance)
                .FirstOrDefault(x => string.Equals(x.Name, property.Key, StringComparison.InvariantCultureIgnoreCase));

            if (field == null)
            {
                continue;
            }

            var fieldType = field switch
            {
                FieldInfo fieldInfo => fieldInfo.FieldType,
                PropertyInfo propertyInfo => propertyInfo.PropertyType,
                _ => throw new NotSupportedException()
            };

            property.Value.Nullable = fieldType.IsValueType
                ? Nullable.GetUnderlyingType(fieldType) != null
                : !field.IsNonNullableReferenceType();
        }
    }
}