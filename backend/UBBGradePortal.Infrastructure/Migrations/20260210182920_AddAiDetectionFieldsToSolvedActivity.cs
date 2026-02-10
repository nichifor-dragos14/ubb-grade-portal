using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UBBGradePortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiDetectionFieldsToSolvedActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AiDetectedBadPoints",
                table: "SolvedActivities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AiDetectedGoodPoints",
                table: "SolvedActivities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AiDetectedSummary",
                table: "SolvedActivities",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiDetectedBadPoints",
                table: "SolvedActivities");

            migrationBuilder.DropColumn(
                name: "AiDetectedGoodPoints",
                table: "SolvedActivities");

            migrationBuilder.DropColumn(
                name: "AiDetectedSummary",
                table: "SolvedActivities");
        }
    }
}
