import traceback

from flask import request
from flask_api import FlaskAPI, status
from flask_api.response import APIResponse
from muddy import maker
from muddy.exceptions import InputException
from muddy.utils import get_direction_object, get_ipversion_object, get_protocol_object, get_match_type_object
from werkzeug.exceptions import HTTPException

from config import app_config


def create_app(config_name=None):
    app = FlaskAPI(__name__, instance_relative_config=True)
    if config_name is None:
        app.config.from_object(app_config['development'])
    else:
        app.config.from_object(app_config[config_name])

    @app.route('/', methods=['GET'])
    def heath():
        return "Sever is running", status.HTTP_200_OK

    @app.route('/makeMud', methods=['GET'])
    def make_mud():
        input_data = request.data
        directions_initiated = []
        for direction_initiated in input_data['directions_initiated']:
            directions_initiated.append(get_direction_object(direction_initiated))
        input_data['directions_initiated'] = directions_initiated
        input_data['ip_version'] = get_ipversion_object(input_data['ip_version'])
        input_data['protocol'] = get_protocol_object(input_data['protocol'])
        input_data['match_type'] = get_match_type_object(input_data['match_type'])
        return maker.make_mud(**request.data), status.HTTP_200_OK

    @app.after_request
    def after_request(response: APIResponse) -> APIResponse:
        if status.is_success(int(str(response.status).split(' ')[0])):
            app.logger.info('%s %s %s %s %s', request.remote_addr, request.method, request.scheme,
                            request.full_path, response.status)
        return response

    @app.errorhandler(Exception)
    def exceptions(e: Exception):
        if isinstance(e, HTTPException):
            app.logger.warning('%s %s %s %s %s', request.remote_addr, request.method, request.scheme,
                               request.full_path, e.status)
            return e.message, e.status
        elif isinstance(e, InputException):
            app.logger.warning('%s %s %s %s %s', request.remote_addr, request.method, request.scheme,
                               request.full_path, status.HTTP_400_BAD_REQUEST)
            return getattr(e, 'message', repr(e)), status.HTTP_400_BAD_REQUEST
        else:
            tb = traceback.format_exc()
            app.logger.error('%s %s %s %s 5xx INTERNAL SERVER ERROR\n%s', request.remote_addr, request.method,
                             request.scheme, request.full_path, tb)
            return 'Internal Server Error', status.HTTP_500_INTERNAL_SERVER_ERROR

    return app
