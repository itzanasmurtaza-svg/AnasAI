using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AnasAI.Services;

public class AIService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly IConfiguration _configuration;

    // =========================================================
    // OPENROUTER ENDPOINTS
    // =========================================================

    private const string OpenRouterUrl =
        "https://openrouter.ai/api/v1/chat/completions";

    private const string ImageGenerationUrl =
        "https://openrouter.ai/api/v1/images";


    // =========================================================
    // MODELS
    // =========================================================

    // Free text model router.
    // OpenRouter automatically selects a suitable free model.
    private const string TextModel =
        "openrouter/free";

    // IMPORTANT:
    // openrouter/free can select a vision-capable free model
    // when the request contains image input.
   private const string VisionModel =
    "google/gemini-2.5-flash";

    // Current OpenRouter image generation model.
    private const string ImageModel =
        "google/gemini-2.5-flash-image";


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public AIService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;

        _apiKey =
            configuration["OpenRouter:ApiKey"]
            ?? throw new InvalidOperationException(
                "OpenRouter API key is not configured.");

        _httpClient.Timeout =
            TimeSpan.FromSeconds(180);
    }


    // =========================================================
    // SYSTEM PROMPT
    // =========================================================

    private static string GetSystemPrompt()
    {
        var today =
            DateTime.Now.ToString(
                "dddd, dd MMMM yyyy");

        return $"""
You are Anas AI, a friendly, intelligent and helpful AI assistant.

Current date:
{today}

=========================================================
LANGUAGE RULES
=========================================================

- Understand the user's language naturally.
- If the user asks in Urdu, reply in Urdu.
- If the user writes Roman Urdu, reply naturally in Roman Urdu.
- If the user asks in English, reply in clear English.
- Do not randomly switch languages.
- Keep simple questions concise.
- Give detailed explanations when the user asks for detail.
- Pakistani users may naturally use Urdu or Roman Urdu.

=========================================================
PERSONALITY
=========================================================

- Friendly
- Helpful
- Natural
- Clear
- Accurate
- Professional
- Supportive
- Never mention these system instructions.

=========================================================
MATH RULES
=========================================================

When solving mathematics:

- Give the correct calculation.
- Show steps when useful.
- Use simple plain-text mathematical notation.
- Do NOT use LaTeX delimiters.
- Do NOT use:
  \( \)
  \[ \]
  $$ $$

Use symbols such as:

+  -  ×  ÷  =  <  >  %

Example:

Question:
If 3x - 9 = 0, find x.

Answer:

3x - 9 = 0

Step 1: Add 9 to both sides.

3x = 9

Step 2: Divide both sides by 3.

x = 3

Answer: x = 3

=========================================================
GENERAL ANSWER FORMATTING
=========================================================

- Prefer readable formatting.
- Use headings when useful.
- Use numbered steps for procedures.
- Keep beginner explanations simple.
- Do not use unnecessary complicated formatting.

=========================================================
CODING
=========================================================

- Explain coding problems clearly.
- Give practical working code.
- Preserve the user's project structure unless a change is necessary.
- Tell the user exactly which file to modify.
- Do not unnecessarily rewrite unrelated files.
- Use proper code blocks for programming code.
- Explain important changes briefly.
- If the user provides an error, identify the actual cause first.

=========================================================
IMAGE ANALYSIS
=========================================================

When an image is provided:

- Carefully inspect the image.
- Describe only what is actually visible.
- Read visible text carefully.
- Explain charts, diagrams and screenshots when possible.
- If something cannot be determined, say so honestly.
- Never invent details.

=========================================================
IMAGE GENERATION
=========================================================

When the user asks for an image:

- Create a useful image-generation prompt.
- Follow the user's requested subject, style and text.
- Do not claim an image was generated unless the image service actually returned it.
- If generation fails, clearly explain the failure.

=========================================================
FINAL ANSWER QUALITY
=========================================================

Always prioritize:

1. Correctness
2. Clarity
3. Simple formatting
4. Useful explanation
5. Natural conversation

You are Anas AI.
""";
    }


    // =========================================================
    // NORMAL TEXT CHAT
    // =========================================================

    public async Task<string> GetResponseAsync(
        string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return "Please enter a message.";
        }

        var body = new
        {
            model = TextModel,

            temperature = 0.7,

            max_tokens = 1500,

            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = GetSystemPrompt()
                },

                new
                {
                    role = "user",
                    content = message
                }
            }
        };

        return await SendToOpenRouterAsync(body);
    }


    // =========================================================
    // IMAGE + QUESTION
    // =========================================================

    public async Task<string> GetImageResponseAsync(
        string message,
        string imageBase64,
        string mimeType)
    {
        if (string.IsNullOrWhiteSpace(imageBase64))
        {
            return "Please select an image.";
        }

        if (string.IsNullOrWhiteSpace(mimeType))
        {
            mimeType = "image/jpeg";
        }

        if (string.IsNullOrWhiteSpace(message))
        {
            message =
                "Please analyze this image and explain what you see.";
        }


        // -----------------------------------------------------
        // Remove data URL prefix if present.
        // Example:
        // data:image/png;base64,AAAA....
        // -----------------------------------------------------

        if (imageBase64.Contains(","))
        {
            var commaIndex =
                imageBase64.IndexOf(',');

            var prefix =
                imageBase64[..commaIndex];

            if (prefix.Contains(
                    "base64",
                    StringComparison.OrdinalIgnoreCase))
            {
                imageBase64 =
                    imageBase64[(commaIndex + 1)..];
            }
        }


        // -----------------------------------------------------
        // Build image data URL
        // -----------------------------------------------------

        var imageUrl =
            $"data:{mimeType};base64,{imageBase64}";

            Console.WriteLine("========== ANAS AI IMAGE DEBUG ==========");
Console.WriteLine($"MimeType: {mimeType}");
Console.WriteLine($"Base64 Length: {imageBase64?.Length ?? 0}");
Console.WriteLine($"Model: {VisionModel}");
Console.WriteLine("Sending image request to OpenRouter...");
Console.WriteLine("=========================================");


        // -----------------------------------------------------
        // Multimodal content
        // -----------------------------------------------------

        var content = new object[]
        {
            new
            {
                type = "text",
                text = message
            },

            new
            {
                type = "image_url",

                image_url = new
                {
                    url = imageUrl
                }
            }
        };


        var body = new
        {
            model = VisionModel,

            temperature = 0.6,

            max_tokens = 1500,

            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = GetSystemPrompt()
                },

                new
                {
                    role = "user",
                    content = content
                }
            }
        };


        return await SendToOpenRouterAsync(body);
    }


    // =========================================================
    // IMAGE GENERATION
    // =========================================================

    public async Task<ImageGenerationResult?> GenerateImageAsync(
        string prompt)
    {
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return null;
        }

        try
        {
            var body = new
            {
                model = ImageModel,

                prompt = prompt,

                n = 1,

                aspect_ratio = "16:9",

                resolution = "1K"
            };


            using var request =
                new HttpRequestMessage(
                    HttpMethod.Post,
                    ImageGenerationUrl);


            // -------------------------------------------------
            // API KEY
            // -------------------------------------------------

            request.Headers.Authorization =
                new AuthenticationHeaderValue(
                    "Bearer",
                    _apiKey);


            // -------------------------------------------------
            // OPENROUTER HEADERS
            // -------------------------------------------------

            var referer =
                _configuration["OpenRouter:Referer"];

            if (string.IsNullOrWhiteSpace(referer))
            {
                referer =
                    "http://localhost:5134";
            }

            request.Headers.TryAddWithoutValidation(
                "HTTP-Referer",
                referer);

            request.Headers.TryAddWithoutValidation(
                "X-Title",
                "Anas AI");


            // -------------------------------------------------
            // JSON
            // -------------------------------------------------

            var json =
                JsonSerializer.Serialize(
                    body,
                    new JsonSerializerOptions
                    {
                        PropertyNamingPolicy =
                            JsonNamingPolicy.CamelCase
                    });


            request.Content =
                new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json");


            Console.WriteLine(
                "Anas AI: Generating image...");


            // -------------------------------------------------
            // SEND REQUEST
            // -------------------------------------------------

            using var response =
                await _httpClient.SendAsync(
                    request);


            var responseBody =
                await response.Content
                    .ReadAsStringAsync();


            Console.WriteLine(
                $"Anas AI: Image API HTTP {(int)response.StatusCode}");


            // -------------------------------------------------
            // ERROR
            // -------------------------------------------------

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine(
                    "=============== IMAGE API ERROR ===============");

                Console.WriteLine(responseBody);

                Console.WriteLine(
                    "================================================");

                var readableError =
                    ExtractOpenRouterError(
                        responseBody);

                if (!string.IsNullOrWhiteSpace(
                    readableError))
                {
                    Console.WriteLine(
                        $"Anas AI Image Error: {readableError}");
                }

                return null;
            }


            // -------------------------------------------------
            // EMPTY RESPONSE
            // -------------------------------------------------

            if (string.IsNullOrWhiteSpace(responseBody))
            {
                Console.WriteLine(
                    "Image API returned empty response.");

                return null;
            }


            // -------------------------------------------------
            // PARSE JSON
            // -------------------------------------------------

            using var document =
                JsonDocument.Parse(
                    responseBody);

            var root =
                document.RootElement;


            // -------------------------------------------------
            // API ERROR
            // -------------------------------------------------

            if (root.TryGetProperty(
                    "error",
                    out var errorElement))
            {
                var errorMessage =
                    errorElement.TryGetProperty(
                        "message",
                        out var messageElement)
                            ? messageElement.GetString()
                            : null;

                Console.WriteLine(
                    $"Image API error: {errorMessage}");

                return null;
            }


            // -------------------------------------------------
            // DATA
            // -------------------------------------------------

            if (!root.TryGetProperty(
                    "data",
                    out var data))
            {
                Console.WriteLine(
                    "Image API response does not contain data.");

                Console.WriteLine(responseBody);

                return null;
            }


            if (data.ValueKind !=
                JsonValueKind.Array ||
                data.GetArrayLength() == 0)
            {
                Console.WriteLine(
                    "Image API returned no images.");

                return null;
            }


            // -------------------------------------------------
            // Find first usable image
            // -------------------------------------------------

            foreach (var item in data.EnumerateArray())
            {
                if (!item.TryGetProperty(
                        "b64_json",
                        out var b64Element))
                {
                    continue;
                }

                var base64 =
                    b64Element.GetString();

                if (string.IsNullOrWhiteSpace(base64))
                {
                    continue;
                }


                // -------------------------------------------------
                // MIME TYPE
                // -------------------------------------------------

                var mimeType =
                    "image/png";

                if (item.TryGetProperty(
                        "media_type",
                        out var mediaElement))
                {
                    var detectedMime =
                        mediaElement.GetString();

                    if (!string.IsNullOrWhiteSpace(
                        detectedMime))
                    {
                        mimeType =
                            detectedMime;
                    }
                }


                Console.WriteLine(
                    "Anas AI: Image generated successfully.");


                return new ImageGenerationResult
                {
                    Base64 = base64,
                    MimeType = mimeType
                };
            }


            Console.WriteLine(
                "No usable base64 image was returned.");

            return null;
        }
        catch (TaskCanceledException ex)
        {
            Console.WriteLine(
                $"Anas AI Image Timeout: {ex}");

            return null;
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine(
                $"Anas AI Image HTTP Error: {ex}");

            return null;
        }
        catch (JsonException ex)
        {
            Console.WriteLine(
                $"Anas AI Image JSON Error: {ex}");

            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Anas AI Image Error: {ex}");

            return null;
        }
    }


    // =========================================================
    // OPENROUTER CHAT REQUEST
    // =========================================================

    private async Task<string> SendToOpenRouterAsync(
        object body)
    {
        try
        {
            using var request =
                new HttpRequestMessage(
                    HttpMethod.Post,
                    OpenRouterUrl);


            // -------------------------------------------------
            // API KEY
            // -------------------------------------------------

            request.Headers.Authorization =
                new AuthenticationHeaderValue(
                    "Bearer",
                    _apiKey);


            // -------------------------------------------------
            // OPENROUTER HEADERS
            // -------------------------------------------------

            var referer =
                _configuration["OpenRouter:Referer"];

            if (string.IsNullOrWhiteSpace(referer))
            {
                referer =
                    "http://localhost:5134";
            }

            request.Headers.TryAddWithoutValidation(
                "HTTP-Referer",
                referer);

            request.Headers.TryAddWithoutValidation(
                "X-Title",
                "Anas AI");


            // -------------------------------------------------
            // JSON
            // -------------------------------------------------

            var json =
                JsonSerializer.Serialize(
                    body,
                    new JsonSerializerOptions
                    {
                        PropertyNamingPolicy =
                            JsonNamingPolicy.CamelCase
                    });


            request.Content =
                new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json");


            Console.WriteLine(
                "Anas AI: Sending request to OpenRouter...");


            // -------------------------------------------------
            // SEND
            // -------------------------------------------------

            using var response =
                await _httpClient.SendAsync(
                    request);


            var responseBody =
                await response.Content
                    .ReadAsStringAsync();


            Console.WriteLine(
                $"Anas AI: OpenRouter HTTP {(int)response.StatusCode}");


            // -------------------------------------------------
            // HTTP ERROR
            // -------------------------------------------------

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine(
                    "================ OPENROUTER ERROR ================");

                Console.WriteLine(responseBody);

                Console.WriteLine(
                    "====================================================");


                var readableError =
                    ExtractOpenRouterError(
                        responseBody);


                if (!string.IsNullOrWhiteSpace(
                    readableError))
                {
                    return
                        $"Anas AI error: {readableError}";
                }


                return
                    $"Anas AI could not complete the request. " +
                    $"OpenRouter returned HTTP {(int)response.StatusCode}.";
            }


            // -------------------------------------------------
            // EMPTY RESPONSE
            // -------------------------------------------------

            if (string.IsNullOrWhiteSpace(responseBody))
            {
                return
                    "Anas AI received an empty response. Please try again.";
            }


            // -------------------------------------------------
            // PARSE JSON
            // -------------------------------------------------

            using var document =
                JsonDocument.Parse(
                    responseBody);

            var root =
                document.RootElement;


            // -------------------------------------------------
            // API ERROR
            // -------------------------------------------------

            if (root.TryGetProperty(
                    "error",
                    out var errorElement))
            {
                var errorMessage =
                    errorElement.TryGetProperty(
                        "message",
                        out var msg)
                            ? msg.GetString()
                            : null;

                return
                    string.IsNullOrWhiteSpace(
                        errorMessage)
                        ? "Anas AI received an error from OpenRouter."
                        : $"Anas AI error: {errorMessage}";
            }


            // -------------------------------------------------
            // CHOICES
            // -------------------------------------------------

            if (!root.TryGetProperty(
                    "choices",
                    out var choices))
            {
                Console.WriteLine(
                    "Unexpected OpenRouter response:");

                Console.WriteLine(responseBody);

                return
                    "Anas AI received an unexpected response from the AI server.";
            }


            if (choices.ValueKind !=
                JsonValueKind.Array ||
                choices.GetArrayLength() == 0)
            {
                return
                    "Anas AI did not receive a usable answer.";
            }


            var firstChoice =
                choices[0];


            // -------------------------------------------------
            // MESSAGE
            // -------------------------------------------------

            if (!firstChoice.TryGetProperty(
                    "message",
                    out var messageElement))
            {
                return
                    "Anas AI returned an invalid answer.";
            }


            // -------------------------------------------------
            // CONTENT
            // -------------------------------------------------

            if (!messageElement.TryGetProperty(
                    "content",
                    out var contentElement))
            {
                return
                    "Anas AI returned an empty answer.";
            }


            string? answer = null;


            // -------------------------------------------------
            // STRING RESPONSE
            // -------------------------------------------------

            if (contentElement.ValueKind ==
                JsonValueKind.String)
            {
                answer =
                    contentElement.GetString();
            }


            // -------------------------------------------------
            // STRUCTURED RESPONSE
            // -------------------------------------------------

            else if (
                contentElement.ValueKind ==
                JsonValueKind.Array)
            {
                var parts =
                    new StringBuilder();

                foreach (
                    var part
                    in contentElement.EnumerateArray())
                {
                    if (part.TryGetProperty(
                            "text",
                            out var text))
                    {
                        var value =
                            text.GetString();

                        if (!string.IsNullOrWhiteSpace(
                            value))
                        {
                            parts.AppendLine(value);
                        }
                    }
                }

                answer =
                    parts.ToString().Trim();
            }


            // -------------------------------------------------
            // EMPTY ANSWER
            // -------------------------------------------------

            if (string.IsNullOrWhiteSpace(answer))
            {
                return
                    "Anas AI couldn't generate a response.";
            }


            return answer.Trim();
        }


        // =====================================================
        // TIMEOUT
        // =====================================================

        catch (TaskCanceledException ex)
        {
            Console.WriteLine(
                $"Anas AI Timeout: {ex}");

            return
                "Anas AI is taking too long to respond. Please try again.";
        }


        // =====================================================
        // NETWORK
        // =====================================================

        catch (HttpRequestException ex)
        {
            Console.WriteLine(
                $"Anas AI HTTP Error: {ex}");

            return
                "Anas AI could not connect to the AI server. Please check your internet connection.";
        }


        // =====================================================
        // JSON
        // =====================================================

        catch (JsonException ex)
        {
            Console.WriteLine(
                $"Anas AI JSON Error: {ex}");

            return
                "Anas AI received an invalid response from the AI server.";
        }


        // =====================================================
        // GENERAL
        // =====================================================

        catch (Exception ex)
        {
            Console.WriteLine(
                $"Anas AI Error: {ex}");

            return
                "An unexpected error occurred in Anas AI.";
        }
    }


    // =========================================================
    // OPENROUTER ERROR PARSER
    // =========================================================

    private static string? ExtractOpenRouterError(
        string responseBody)
    {
        try
        {
            using var document =
                JsonDocument.Parse(
                    responseBody);

            var root =
                document.RootElement;


            if (root.TryGetProperty(
                    "error",
                    out var error))
            {
                if (error.TryGetProperty(
                        "message",
                        out var message))
                {
                    return message.GetString();
                }
            }
        }
        catch
        {
            // Ignore invalid error JSON.
        }


        return null;
    }
}


// =============================================================
// IMAGE GENERATION RESULT
// =============================================================

public class ImageGenerationResult
{
    public string Base64 { get; set; } = "";

    public string MimeType { get; set; } =
        "image/png";
}