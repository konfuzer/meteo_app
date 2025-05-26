from django.utils.deprecation import MiddlewareMixin

class UserCityHistoryMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if 'city' in request.GET:
            request.session['last_city'] = request.GET['city']
        return response
