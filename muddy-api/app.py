import traceback

from flask import request
from flask_api import FlaskAPI, status
from flask_api.response import APIResponse
from muddy import maker
from muddy.exceptions import InputException
from muddy.models import MatchType, Direction, IPVersion, Protocol
from werkzeug.exceptions import HTTPException

from config import app_config


def get_ipversion_object(ip_version):
    if ip_version == 'ipv4':
        return IPVersion.IPV4
    if ip_version == 'ipv6':
        return IPVersion.IPV4
    if ip_version == 'both':
        return IPVersion.BOTH
    raise InputException(f'ip_version is not valid: {ip_version}')


def get_protocol_object(protocol):
    if protocol == 'udp':
        return Protocol.UDP
    if protocol == 'tcp':
        return Protocol.TCP
    if protocol == 'any':
        return Protocol.ANY
    raise InputException(f'protocol is not valid: {protocol}')


def get_direction_object(direction):
    if direction == 'to_device':
        return Direction.TO_DEVICE
    if direction == 'from_device':
        return Direction.FROM_DEVICE
    raise InputException(f'direction is not valid: {direction}')


def get_match_type_object(match_type):
    if match_type == 'is_my_controller':
        return MatchType.IS_MY_CONTROLLER
    if match_type == 'is_controller':
        return MatchType.IS_CONTROLLER
    if match_type == 'is_mfg':
        return MatchType.IS_MFG
    if match_type == 'is_mymfg':
        return MatchType.IS_MYMFG
    if match_type == 'is_cloud':
        return MatchType.IS_CLOUD
    raise InputException(f'match_type is not valid: {match_type}')


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
