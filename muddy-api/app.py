import traceback

from flask import request
from flask_api import FlaskAPI, status
from flask_api.response import APIResponse
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

    @app.route('/makeMud', methods=['POST'])
    def makeMud():
        pass

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
        else:
            tb = traceback.format_exc()
            app.logger.error('%s %s %s %s 5xx INTERNAL SERVER ERROR\n%s', request.remote_addr, request.method,
                             request.scheme, request.full_path, tb)
            return 'Internal Server Error', status.HTTP_500_INTERNAL_SERVER_ERROR

    return app
