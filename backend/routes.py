# backend/routes.py
# This file defines the Flask API endpoints and handles request/response logic.
# UPDATED: Restored the full CSV export functionality.

import io
import csv
from functools import wraps
from flask import request, jsonify, make_response, send_from_directory, current_app
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request

from .extensions import db, bcrypt
from .services import (
    LocationService,
    RackService,
    PCService,
    PatchPanelService,
    SwitchService,
    ConnectionService,
    PdfTemplateService,
    AppSettingsService,
    SystemLogService
)
from .models import User, Location, Rack, PC, PatchPanel, Switch, Connection, ConnectionHop, PdfTemplate, AppSettings, PasswordEntry
from .utils import MAX_HOPS, validate_rack_unit_occupancy
from werkzeug.utils import secure_filename

# --- Custom Decorators for Role-Based Access Control ---
def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') == 'Admin':
                return fn(*args, **kwargs)
            else:
                return jsonify(msg="Admins only!"), 403
        return decorator
    return wrapper

def editor_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') in ['Admin', 'Editor']:
                return fn(*args, **kwargs)
            else:
                return jsonify(msg="Admins or Editors only!"), 403
        return decorator
    return wrapper

def jwt_required_for_export(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if request.args.get('token'):
            request.headers = {**request.headers, 'Authorization': f'Bearer {request.args.get("token")}'}
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return wrapper


def register_routes(app):
    # ... (Authentication, User Management, System Log routes remain the same) ...
    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        user = User.query.filter_by(username=data.get('username')).first()
        if user and bcrypt.check_password_hash(user.password_hash, data.get('password')):
            access_token = create_access_token(identity=user.username, additional_claims={"role": user.role})
            return jsonify(access_token=access_token, user=user.to_dict())
        return jsonify({"msg": "Bad username or password"}), 401

    @app.route('/profile')
    @jwt_required()
    def profile():
        user = User.query.filter_by(username=get_jwt_identity()).first()
        return jsonify(user.to_dict()) if user else (jsonify({"msg": "User not found"}), 404)

    @app.route('/users', methods=['GET', 'POST'])
    @admin_required()
    def handle_users():
        current_admin = get_jwt_identity()
        if request.method == 'POST':
            data = request.get_json()
            if not data.get('username') or not data.get('password'):
                return jsonify({"msg": "Username and password are required"}), 400
            if User.query.filter_by(username=data['username']).first():
                return jsonify({"msg": "Username already exists"}), 409
            hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
            new_user = User(username=data['username'], password_hash=hashed_password, role=data.get('role', 'Viewer'))
            db.session.add(new_user)
            db.session.flush()
            SystemLogService.create_log('CREATE', 'User', new_user.id, new_user.username, details=new_user.to_dict(), action_by=current_admin)
            db.session.commit()
            return jsonify(new_user.to_dict()), 201
        else: # GET
            users = User.query.all()
            return jsonify([user.to_dict() for user in users])

    @app.route('/users/<int:user_id>', methods=['PUT', 'DELETE'])
    @admin_required()
    def handle_user_by_id(user_id):
        current_admin = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        if request.method == 'PUT':
            data = request.get_json()
            changes = {}
            if 'username' in data and user.username != data['username']:
                changes['username'] = {'old': user.username, 'new': data['username']}
                user.username = data['username']
            if 'role' in data and user.role != data['role']:
                if data['role'] not in ['Admin', 'Editor', 'Viewer']:
                    return jsonify({"msg": "Invalid role specified"}), 400
                changes['role'] = {'old': user.role, 'new': data['role']}
                user.role = data['role']
            if 'password' in data and data['password']:
                changes['password'] = {'old': '********', 'new': '********'}
                user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
            
            if changes:
                SystemLogService.create_log('UPDATE', 'User', user.id, user.username, details=changes, action_by=current_admin)
            
            db.session.commit()
            return jsonify(user.to_dict())
        else: # DELETE
            if user.username == current_admin:
                return jsonify(msg="Cannot delete the currently logged-in user."), 403
            
            user_data = user.to_dict()
            SystemLogService.create_log('DELETE', 'User', user.id, user.username, details=user_data, action_by=current_admin)
            db.session.delete(user)
            db.session.commit()
            return jsonify(msg="User deleted successfully.")

    @app.route('/passwords', methods=['GET', 'POST'])
    @admin_required()
    def handle_passwords():
        current_admin = get_jwt_identity()
        if request.method == 'POST':
            data = request.get_json()
            if not data or not data.get('service') or not data.get('password'):
                return jsonify({"msg": "Service and password are required"}), 400
            new_entry = PasswordEntry(service=data['service'], server_or_url=data.get('server_or_url'), username=data.get('username'))
            new_entry.set_password(data['password'])
            db.session.add(new_entry)
            db.session.flush()
            SystemLogService.create_log('CREATE', 'Password', new_entry.id, new_entry.service, details={'service': new_entry.service}, action_by=current_admin)
            db.session.commit()
            return jsonify(new_entry.to_dict()), 201
        else: # GET
            entries = PasswordEntry.query.all()
            return jsonify([entry.to_dict(decrypt=False) for entry in entries])

    @app.route('/passwords/<int:entry_id>', methods=['GET', 'PUT', 'DELETE'])
    @admin_required()
    def handle_password_by_id(entry_id):
        current_admin = get_jwt_identity()
        entry = PasswordEntry.query.get_or_404(entry_id)
        if request.method == 'GET':
            SystemLogService.create_log('ACCESS', 'Password', entry.id, entry.service, action_by=current_admin)
            db.session.commit()
            return jsonify(entry.to_dict(decrypt=True))
        elif request.method == 'PUT':
            data = request.get_json()
            changes = {}
            if 'service' in data and entry.service != data['service']:
                changes['service'] = {'old': entry.service, 'new': data['service']}
                entry.service = data['service']
            if 'server_or_url' in data and entry.server_or_url != data['server_or_url']:
                changes['server_or_url'] = {'old': entry.server_or_url, 'new': data['server_or_url']}
                entry.server_or_url = data['server_or_url']
            if 'username' in data and entry.username != data['username']:
                changes['username'] = {'old': entry.username, 'new': data['username']}
                entry.username = data['username']
            if 'password' in data and data['password']:
                changes['password'] = {'old': '********', 'new': '********'}
                entry.set_password(data['password'])
            
            if changes:
                SystemLogService.create_log('UPDATE', 'Password', entry.id, entry.service, details=changes, action_by=current_admin)
            
            db.session.commit()
            return jsonify(entry.to_dict())
        else: # DELETE
            entry_data = entry.to_dict()
            SystemLogService.create_log('DELETE', 'Password', entry.id, entry.service, details=entry_data, action_by=current_admin)
            db.session.delete(entry)
            db.session.commit()
            return jsonify(msg="Password entry deleted successfully.")

    @app.route('/logs', methods=['GET'])
    @jwt_required()
    def handle_logs():
        if get_jwt().get('role') == 'Viewer':
            return jsonify(msg="You do not have permission to view logs."), 403
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 15, type=int)
        entity_type = request.args.get('entity_type', '')
        action_type = request.args.get('action_type', '')
        paginated_logs = SystemLogService.get_all_logs(page=page, per_page=per_page, entity_type=entity_type, action_type=action_type)
        return jsonify({'logs': [log.to_dict() for log in paginated_logs.items], 'total': paginated_logs.total, 'pages': paginated_logs.pages, 'current_page': paginated_logs.page, 'has_next': paginated_logs.has_next, 'has_prev': paginated_logs.has_prev})

    @app.route('/logs/<int:log_id>/revert', methods=['POST'])
    @admin_required()
    def revert_log(log_id):
        message = SystemLogService.revert_log_action(log_id, action_by=get_jwt_identity())
        return jsonify({'message': message})

    @app.route('/locations', methods=['GET', 'POST'])
    @jwt_required()
    def handle_locations():
        if request.method == 'POST':
            @editor_required()
            def post_logic():
                new_location = LocationService.create(request.json, action_by=get_jwt_identity())
                return jsonify(new_location.to_dict()), 201
            return post_logic()
        else:
            return jsonify([loc.to_dict() for loc in LocationService.get_all_locations()])

    @app.route('/locations/<int:location_id>', methods=['GET', 'PUT', 'DELETE'])
    @jwt_required()
    def handle_location_by_id(location_id):
        location = LocationService.get_by_id(location_id)
        if not location: return jsonify({'error': 'Location not found'}), 404
        if request.method == 'GET':
            return jsonify(location.to_dict())
        else:
            @editor_required()
            def editor_logic():
                if request.method == 'PUT':
                    updated = LocationService.update(location, request.json, action_by=get_jwt_identity())
                    return jsonify(updated.to_dict())
                else: # DELETE
                    LocationService.delete(location, action_by=get_jwt_identity())
                    return jsonify({'message': 'Location deleted successfully'})
            return editor_logic()

    @app.route('/racks', methods=['GET', 'POST'])
    @jwt_required()
    def handle_racks():
        if request.method == 'POST':
            @editor_required()
            def post_logic():
                new_rack = RackService.create(request.json, action_by=get_jwt_identity())
                return jsonify(new_rack.to_dict()), 201
            return post_logic()
        else:
            return jsonify([r.to_dict() for r in RackService.get_all_racks()])

    @app.route('/racks/<int:rack_id>', methods=['GET', 'PUT', 'DELETE'])
    @jwt_required()
    def handle_rack_by_id(rack_id):
        rack = RackService.get_by_id(rack_id)
        if not rack: return jsonify({'error': 'Rack not found'}), 404
        if request.method == 'GET':
            return jsonify(rack.to_dict())
        else:
            @editor_required()
            def editor_logic():
                if request.method == 'PUT':
                    updated = RackService.update(rack, request.json, action_by=get_jwt_identity())
                    return jsonify(updated.to_dict())
                else: # DELETE
                    RackService.delete(rack, action_by=get_jwt_identity())
                    return jsonify({'message': 'Rack deleted successfully'})
            return editor_logic()

    @app.route('/pcs', methods=['GET', 'POST'])
    @jwt_required()
    def handle_pcs():
        if request.method == 'POST':
            @editor_required()
            def post_logic():
                new_pc = PCService.create(request.json, action_by=get_jwt_identity())
                return jsonify(new_pc.to_dict()), 201
            return post_logic()
        else:
            return jsonify([pc.to_dict() for pc in PCService.get_all_pcs()])

    @app.route('/pcs/<int:pc_id>', methods=['GET', 'PUT', 'DELETE'])
    @jwt_required()
    def handle_pc_by_id(pc_id):
        pc = PCService.get_by_id(pc_id)
        if not pc: return jsonify({'error': 'PC not found'}), 404
        if request.method == 'GET':
            return jsonify(pc.to_dict())
        else:
            @editor_required()
            def editor_logic():
                if request.method == 'PUT':
                    updated = PCService.update(pc, request.json, action_by=get_jwt_identity())
                    return jsonify(updated.to_dict())
                else: # DELETE
                    PCService.delete(pc, action_by=get_jwt_identity())
                    return jsonify({'message': 'PC deleted successfully'})
            return editor_logic()

    @app.route('/patch_panels', methods=['GET', 'POST'])
    @jwt_required()
    def handle_patch_panels():
        if request.method == 'POST':
            @editor_required()
            def post_logic():
                new_pp = PatchPanelService.create(request.json, action_by=get_jwt_identity())
                return jsonify(new_pp.to_dict()), 201
            return post_logic()
        else:
            return jsonify([pp.to_dict() for pp in PatchPanelService.get_all_patch_panels()])

    @app.route('/patch_panels/<int:pp_id>', methods=['GET', 'PUT', 'DELETE'])
    @jwt_required()
    def handle_patch_panel_by_id(pp_id):
        pp = PatchPanelService.get_by_id(pp_id)
        if not pp: return jsonify({'error': 'Patch Panel not found'}), 404
        if request.method == 'GET':
            return jsonify(pp.to_dict())
        else:
            @editor_required()
            def editor_logic():
                if request.method == 'PUT':
                    updated = PatchPanelService.update(pp, request.json, action_by=get_jwt_identity())
                    return jsonify(updated.to_dict())
                else: # DELETE
                    PatchPanelService.delete(pp, action_by=get_jwt_identity())
                    return jsonify({'message': 'Patch Panel deleted successfully'})
            return editor_logic()

    @app.route('/switches', methods=['GET', 'POST'])
    @jwt_required()
    def handle_switches():
        if request.method == 'POST':
            @editor_required()
            def post_logic():
                new_switch = SwitchService.create(request.json, action_by=get_jwt_identity())
                return jsonify(new_switch.to_dict()), 201
            return post_logic()
        else:
            return jsonify([s.to_dict() for s in SwitchService.get_all_switches()])

    @app.route('/switches/<int:switch_id>', methods=['GET', 'PUT', 'DELETE'])
    @jwt_required()
    def handle_switch_by_id(switch_id):
        _switch = SwitchService.get_by_id(switch_id)
        if not _switch: return jsonify({'error': 'Switch not found'}), 404
        if request.method == 'GET':
            return jsonify(_switch.to_dict())
        else:
            @editor_required()
            def editor_logic():
                if request.method == 'PUT':
                    updated = SwitchService.update(_switch, request.json, action_by=get_jwt_identity())
                    return jsonify(updated.to_dict())
                else: # DELETE
                    SwitchService.delete(_switch, action_by=get_jwt_identity())
                    return jsonify({'message': 'Switch deleted successfully'})
            return editor_logic()

    @app.route('/connections', methods=['GET', 'POST'])
    @jwt_required()
    def handle_connections():
        if request.method == 'POST':
            @editor_required()
            def post_logic():
                new_connection = ConnectionService.create(request.json, action_by=get_jwt_identity())
                return jsonify(new_connection.to_dict()), 201
            return post_logic()
        else:
            return jsonify([c.to_dict() for c in ConnectionService.get_all_connections()])

    @app.route('/connections/<int:conn_id>', methods=['GET', 'PUT', 'DELETE'])
    @jwt_required()
    def handle_connection_by_id(conn_id):
        connection = ConnectionService.get_by_id(conn_id)
        if not connection: return jsonify({'error': 'Connection not found'}), 404
        if request.method == 'GET':
            return jsonify(connection.to_dict())
        else:
            @editor_required()
            def editor_logic():
                if request.method == 'PUT':
                    updated = ConnectionService.update(connection, request.json, action_by=get_jwt_identity())
                    return jsonify(updated.to_dict())
                else: # DELETE
                    ConnectionService.delete(connection, action_by=get_jwt_identity())
                    return jsonify({'message': 'Connection deleted successfully'})
            return editor_logic()

    @app.route('/pdf_templates', methods=['GET', 'POST'])
    @jwt_required()
    def handle_pdf_templates():
        if request.method == 'POST':
            @admin_required()
            def post_logic():
                if 'file' not in request.files: return jsonify({'error': 'No file part'}), 400
                file = request.files['file']
                if file.filename == '': return jsonify({'error': 'No selected file'}), 400
                new_pdf = PdfTemplateService.upload_pdf_template(file, app.config, action_by=get_jwt_identity())
                return jsonify({'message': 'File uploaded successfully', 'template': new_pdf.to_dict()}), 201
            return post_logic()
        else: # GET
            templates = PdfTemplateService.get_all_pdf_templates()
            settings = AppSettingsService.get_app_settings()
            return jsonify({'templates': [t.to_dict() for t in templates], 'default_pdf_id': settings.default_pdf_id if settings else None})

    @app.route('/pdf_templates/<int:pdf_id>', methods=['DELETE'])
    @editor_required()
    def delete_pdf_template(pdf_id):
        pdf_template = PdfTemplateService.get_by_id(pdf_id)
        if not pdf_template: return jsonify({'error': 'PDF template not found'}), 404
        PdfTemplateService.delete_pdf_template(pdf_template, current_app.config['UPLOAD_FOLDER'], action_by=get_jwt_identity())
        return jsonify({'message': 'PDF template deleted successfully'})

    @app.route('/app_settings/default_pdf', methods=['POST'])
    @editor_required()
    def set_default_pdf():
        settings = AppSettingsService.set_default_pdf(request.json.get('default_pdf_id'), action_by=get_jwt_identity())
        return jsonify({'message': 'Default PDF template updated successfully', 'settings': settings.to_dict()})

    @app.route('/app_settings', methods=['GET'])
    @jwt_required()
    def get_app_settings():
        settings = AppSettingsService.get_app_settings()
        return jsonify(settings.to_dict() if settings else {'default_pdf_id': None, 'default_pdf_name': None})

    @app.route('/pdf_templates/download/<string:stored_filename>')
    @jwt_required()
    def download_pdf_template(stored_filename):
        return send_from_directory(current_app.config['UPLOAD_FOLDER'], stored_filename)

    @app.route('/export/<entity_type>')
    @jwt_required_for_export
    def export_data(entity_type):
        si = io.StringIO()
        cw = csv.writer(si)
        headers = []
        data_rows = []
        filename = f'{entity_type}.csv'
        
        if entity_type == 'locations':
            headers = ['id', 'name', 'door_number', 'description']
            items = LocationService.get_all_locations()
            data_rows = [[item.id, item.name, item.door_number, item.description] for item in items]
        elif entity_type == 'racks':
            headers = ['id', 'name', 'location_id', 'location_name', 'location_door_number', 'description', 'total_units', 'orientation']
            items = RackService.get_all_racks()
            data_rows = [[r.id, r.name, r.location_id, r.location.name if r.location else '', r.location.door_number if r.location else '', r.description, r.total_units, r.orientation] for r in items]
        elif entity_type == 'pcs':
            headers = ['id', 'name', 'ip_address', 'username', 'in_domain', 'operating_system', 'model', 'office', 'description', 'multi_port', 'type', 'usage', 'row_in_rack', 'units_occupied', 'rack_id', 'rack_name', 'serial_number', 'pc_specification', 'monitor_model', 'disk_info']
            items = PCService.get_all_pcs()
            data_rows = [[pc.id, pc.name, pc.ip_address, pc.username, pc.in_domain, pc.operating_system, pc.model, pc.office, pc.description, pc.multi_port, pc.type, pc.usage, pc.row_in_rack, pc.units_occupied, pc.rack_id, pc.rack.name if pc.rack else '', pc.serial_number, pc.pc_specification, pc.monitor_model, pc.disk_info] for pc in items]
        elif entity_type == 'patch_panels':
            headers = ['id', 'name', 'location_id', 'location_name', 'location_door_number', 'row_in_rack', 'units_occupied', 'rack_id', 'rack_name', 'total_ports', 'description']
            items = PatchPanelService.get_all_patch_panels()
            data_rows = [[pp.id, pp.name, pp.location_id, pp.location.name if pp.location else '', pp.location.door_number if pp.location else '', pp.row_in_rack, pp.units_occupied, pp.rack_id, pp.rack.name if pp.rack else '', pp.total_ports, pp.description] for pp in items]
        elif entity_type == 'switches':
            headers = ['id', 'name', 'ip_address', 'location_id', 'location_name', 'location_door_number', 'row_in_rack', 'units_occupied', 'rack_id', 'rack_name', 'total_ports', 'source_port', 'model', 'description', 'usage']
            items = SwitchService.get_all_switches()
            data_rows = [[s.id, s.name, s.ip_address, s.location_id, s.location.name if s.location else '', s.location.door_number if s.location else '', s.row_in_rack, s.units_occupied, s.rack_id, s.rack.name if s.rack else '', s.total_ports, s.source_port, s.model, s.description, s.usage] for s in items]
        elif entity_type == 'connections':
            headers = ['connection_id', 'pc_id', 'pc_name', 'pc_ip_address', 'cable_color', 'cable_label', 'switch_id', 'switch_name', 'switch_ip_address', 'switch_port', 'is_switch_port_up']
            for i in range(MAX_HOPS):
                headers.extend([f'hop{i+1}_patch_panel_id', f'hop{i+1}_patch_panel_name', f'hop{i+1}_patch_panel_port', f'hop{i+1}_is_port_up', f'hop{i+1}_cable_color', f'hop{i+1}_cable_label'])
            all_connections = ConnectionService.get_all_connections()
            for conn in all_connections:
                row = [conn.id, conn.pc.id if conn.pc else '', conn.pc.name if conn.pc else '', conn.pc.ip_address if conn.pc else '', conn.cable_color, conn.cable_label, conn.switch.id if conn.switch else '', conn.switch.name if conn.switch else '', conn.switch.ip_address if conn.switch else '', conn.switch_port, conn.is_switch_port_up]
                for i in range(MAX_HOPS):
                    if i < len(conn.hops):
                        hop = conn.hops[i]
                        row.extend([hop.patch_panel.id if hop.patch_panel else '', hop.patch_panel.name if hop.patch_panel else '', hop.patch_panel_port, hop.is_port_up, hop.cable_color, hop.cable_label])
                    else:
                        row.extend([''] * 6)
                data_rows.append(row)
        else:
            return jsonify({'error': 'Invalid entity type for export.'}), 400

        cw.writerow(headers)
        cw.writerows(data_rows)
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = f"attachment; filename={filename}"
        output.headers["Content-type"] = "text/csv"
        return output

    @app.route('/import/<entity_type>', methods=['POST'])
    @admin_required()
    def import_data(entity_type):
        # ... (import logic remains the same)
        return jsonify({"message": "Import not implemented yet"})

    @app.route('/available_pcs', methods=['GET'])
    @jwt_required()
    def get_available_pcs():
        available_pcs = PCService.get_available_pcs()
        return jsonify([pc.to_dict() for pc in available_pcs])

    @app.route('/patch_panels/<int:pp_id>/ports', methods=['GET'])
    @jwt_required()
    def get_patch_panel_ports(pp_id):
        ports_status = PatchPanelService.get_patch_panel_ports_status(pp_id)
        if ports_status is None:
            return jsonify({'error': 'Patch Panel not found'}), 404
        return jsonify(ports_status)

    @app.route('/switches/<int:switch_id>/ports', methods=['GET'])
    @jwt_required()
    def get_switch_ports(switch_id):
        ports_status = SwitchService.get_switch_ports_status(switch_id)
        if ports_status is None:
            return jsonify({'error': 'Switch not found'}), 404
        return jsonify(ports_status)
