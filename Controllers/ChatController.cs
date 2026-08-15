using AnasAI.Services;
using Microsoft.AspNetCore.Mvc;

namespace AnasAI.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly IAIService _aiService;

    public ChatController(IAIService aiService)
    {
        _aiService = aiService;
    }


    // ==========================================
    // NORMAL TEXT CHAT
    // POST: /api/chat
    // ==========================================

    [HttpPost]
    public async Task<IActionResult> Chat(
        [FromBody] ChatRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new
            {
                error = "Message cannot be empty."
            });
        }

        try
        {
            var response =
                await _aiService.GetResponseAsync(
                    request.Message);

            return Ok(new
            {
                response
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error = ex.Message
            });
        }
    }


    // ==========================================
    // IMAGE + QUESTION
    // POST: /api/chat/image
    // ==========================================

    [HttpPost("image")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> ImageChat(
        [FromBody] ImageChatRequest request)
    {
        if (request == null)
        {
            return BadRequest(new
            {
                error = "Invalid image request."
            });
        }

        if (string.IsNullOrWhiteSpace(
            request.ImageBase64))
        {
            return BadRequest(new
            {
                error = "Please select an image."
            });
        }

        try
        {
            var response =
                await _aiService.GetImageResponseAsync(
                    request.Message ?? "",
                    request.ImageBase64,
                    string.IsNullOrWhiteSpace(
                        request.MimeType)
                        ? "image/jpeg"
                        : request.MimeType
                );

            return Ok(new
            {
                response
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error =
                    "Image analysis failed: " +
                    ex.Message
            });
        }
    }


    // ==========================================
    // IMAGE GENERATION
    // POST: /api/chat/generate-image
    // ==========================================

    [HttpPost("generate-image")]
    public async Task<IActionResult> GenerateImage(
        [FromBody] ImageGenerationRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Prompt))
        {
            return BadRequest(new
            {
                error =
                    "Image prompt cannot be empty."
            });
        }

        try
        {
            var result =
                await _aiService.GenerateImageAsync(
                    request.Prompt);

            if (result == null ||
                string.IsNullOrWhiteSpace(
                    result.Base64))
            {
                return StatusCode(500, new
                {
                    error =
                        "Anas AI could not generate the image."
                });
            }

            return Ok(new
            {
                imageBase64 = result.Base64,
                mimeType = result.MimeType
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error =
                    "Image generation failed: " +
                    ex.Message
            });
        }
    }
}


// ==========================================
// TEXT REQUEST
// ==========================================

public class ChatRequest
{
    public string Message { get; set; } = "";
}


// ==========================================
// IMAGE REQUEST
// ==========================================

public class ImageChatRequest
{
    public string Message { get; set; } = "";

    public string ImageBase64 { get; set; } = "";

    public string MimeType { get; set; } =
        "image/jpeg";
}


// ==========================================
// IMAGE GENERATION REQUEST
// ==========================================

public class ImageGenerationRequest
{
    public string Prompt { get; set; } = "";
}