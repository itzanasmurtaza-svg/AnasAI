namespace AnasAI.Services;

public interface IAIService
{
    Task<string> GetResponseAsync(
        string message);

    Task<string> GetImageResponseAsync(
        string message,
        string imageBase64,
        string mimeType);

    Task<ImageGenerationResult?> GenerateImageAsync(
        string prompt);
}