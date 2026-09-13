class HealthCheckMiddleware:
    "Bypass ALLOWED_HOSTS validation for health check endpoint."

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == "/api/health/":
            request.META["HTTP_HOST"] = "localhost"
        return self.get_response(request)
