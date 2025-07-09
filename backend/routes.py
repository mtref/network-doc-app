# backend/routes.py
# This file defines the Flask API endpoints and handles request/response logic.
# UPDATED: Renamed PDF template route functions for consistency, resolving a 404 error.

import io
import csv
from functools import wraps
from flask import request, jsonify, make_response, send_from_directory, current_app
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt

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
from .models import User, Location, Rack, PC, PatchPanel, Switch, Connection, ConnectionHop, PdfTemplate, AppSettings, SystemLog
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

def register_routes(app):
    # ... (Authentication and User Management routes remain the same) ...
    # --- Authentication Endpoints ---
    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        username = data.get('username', None)
        password = data.get('password', None)

        user = User.query.filter_by(username=username).first()
        if user and bcrypt.check_password_hash(user.password_hash, password):
            additional_claims = {"role": user.role}
            access_token = create_access_token(identity=user.username, additional_claims=additional_claims)
            return jsonify(access_token=access_token, user=user.to_dict())
        
        return jsonify({"msg": "Bad username or password"}), 401

    @app.route('/profile')
    @jwt_required()
    def profile():
        current_user_username = get_jwt_identity()
        user = User.query.filter_by(username=current_user_username).first()
        if user:
            return jsonify(user.to_dict())
        return jsonify({"msg": "User not found"}), 404

    # --- User Management Endpoints (Admin Only) ---
    @app.route('/users', methods=['GET'])
    @admin_required()
    def get_users():
        users = User.query.all()
        return jsonify([user.to_dict() for user in users])

    @app.route('/users', methods=['POST'])
    @admin_required()
    def create_user():
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'Viewer')

        if not username or not password:
            return jsonify({"msg": "Username and password are required"}), 400
        if User.query.filter_by(username=username).first():
            return jsonify({"msg": "Username already exists"}), 409
        if role not in ['Admin', 'Editor', 'Viewer']:
            return jsonify({"msg": "Invalid role specified"}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, password_hash=hashed_password, role=role)
        db.session.add(new_user)
        db.session.commit()
        return jsonify(new_user.to_dict()), 201

    @app.route('/users/<int:user_id>', methods=['PUT'])
    @admin_required()
    def update_user(user_id):
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if 'username' in data:
            user.username = data['username']
        if 'role' in data:
            if data['role'] not in ['Admin', 'Editor', 'Viewer']:
                 return jsonify({"msg": "Invalid role specified"}), 400
            user.role = data['role']
        if 'password' in data and data['password']:
            user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        db.session.commit()
        return jsonify(user.to_dict())

    @app.route('/users/<int:user_id>', methods=['DELETE'])
    @admin_required()
    def delete_user(user_id):
        user = User.query.get_or_404(user_id)
        current_user_username = get_jwt_identity()
        if user.username == current_user_username:
            return jsonify(msg="Cannot delete the currently logged-in user."), 403
        db.session.delete(user)
        db.session.commit()
        return jsonify(msg="User deleted successfully."), 200

    # --- System Log Endpoints ---
    @app.route('/logs', methods=['GET'])
    @jwt_required()
    def get_system_logs():
        claims = get_jwt()
        if claims.get('role') == 'Viewer':
            return jsonify(msg="You do not have permission to view logs."), 403
        
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 25, type=int)
            entity_type = request.args.get('entity_type', None, type=str)
            action_type = request.args.get('action_type', None, type=str)
            paginated_logs = SystemLogService.get_all_logs(page=page, per_page=per_page, entity_type=entity_type, action_type=action_type)
            return jsonify({'logs': [log.to_dict() for log in paginated_logs.items], 'total': paginated_logs.total, 'pages': paginated_logs.pages, 'current_page': paginated_logs.page, 'has_next': paginated_logs.has_next, 'has_prev': paginated_logs.has_prev}), 200
        except Exception as e:
            app.logger.error(f"Error fetching system logs: {str(e)}")
            return jsonify({'error': 'Failed to fetch system logs'}), 500

    @app.route('/logs/<int:log_id>/revert', methods=['POST'])
    @admin_required()
    def revert_log(log_id):
        current_user = get_jwt_identity()
        try:
            message = SystemLogService.revert_log_action(log_id, action_by=current_user)
            return jsonify({'message': message}), 200
        except ValueError as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error reverting log {log_id}: {str(e)}")
            return jsonify({'error': f'An unexpected error occurred while reverting the action.'}), 500

    # ... (Location, Rack, PC, Patch Panel, Switch, Connection endpoints remain the same) ...
    # Location Endpoints
    @app.route('/locations', methods=['GET'])
    @jwt_required()
    def handle_locations_get():
        locations = LocationService.get_all_locations()
        return jsonify([location.to_dict() for location in locations])

    @app.route('/locations', methods=['POST'])
    @editor_required()
    def handle_locations_post():
        current_user = get_jwt_identity()
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Location name is required'}), 400
        try:
            new_location = LocationService.create(data, action_by=current_user)
            return jsonify(new_location.to_dict()), 201
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': f"Location with name '{data['name']}' already exists."}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/locations/<int:location_id>', methods=['GET'])
    @jwt_required()
    def handle_location_by_id_get(location_id):
        location = LocationService.get_by_id(location_id)
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        return jsonify(location.to_dict())

    @app.route('/locations/<int:location_id>', methods=['PUT'])
    @editor_required()
    def handle_location_by_id_put(location_id):
        current_user = get_jwt_identity()
        location = LocationService.get_by_id(location_id)
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400
        try:
            updated_location = LocationService.update(location, data, action_by=current_user)
            return jsonify(updated_location.to_dict())
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': f"Location with name '{data['name']}' already exists."}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/locations/<int:location_id>', methods=['DELETE'])
    @editor_required()
    def handle_location_by_id_delete(location_id):
        current_user = get_jwt_identity()
        location = LocationService.get_by_id(location_id)
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        try:
            LocationService.delete(location, action_by=current_user)
            return jsonify({'message': 'Location deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # Rack Endpoints
    @app.route('/racks', methods=['GET'])
    @jwt_required()
    def handle_racks_get():
        racks = RackService.get_all_racks()
        return jsonify([rack.to_dict() for rack in racks])

    @app.route('/racks', methods=['POST'])
    @editor_required()
    def handle_racks_post():
        current_user = get_jwt_identity()
        data = request.json
        if not data or not data.get('name') or not data.get('location_id'):
            return jsonify({'error': 'Rack name and location_id are required'}), 400
        try:
            new_rack = RackService.create(data, action_by=current_user)
            return jsonify(new_rack.to_dict()), 201
        except IntegrityError as e:
            db.session.rollback()
            return jsonify({'error': f"A rack with the name '{data['name']}' already exists in this location."}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/racks/<int:rack_id>', methods=['PUT'])
    @editor_required()
    def handle_rack_by_id_put(rack_id):
        current_user = get_jwt_identity()
        rack = RackService.get_by_id(rack_id)
        if not rack:
            return jsonify({'error': 'Rack not found'}), 404
        data = request.json
        try:
            updated_rack = RackService.update(rack, data, action_by=current_user)
            return jsonify(updated_rack.to_dict())
        except IntegrityError as e:
            db.session.rollback()
            return jsonify({'error': f"A rack with the name '{data['name']}' already exists in this location."}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
            
    @app.route('/racks/<int:rack_id>', methods=['DELETE'])
    @editor_required()
    def handle_rack_by_id_delete(rack_id):
        current_user = get_jwt_identity()
        rack = RackService.get_by_id(rack_id)
        if not rack:
            return jsonify({'error': 'Rack not found'}), 404
        try:
            RackService.delete(rack, action_by=current_user)
            return jsonify({'message': 'Rack deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # PC Endpoints
    @app.route('/pcs', methods=['POST'])
    @editor_required()
    def handle_pcs_post():
        current_user = get_jwt_identity()
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'PC name is required'}), 400
        try:
            new_pc = PCService.create(data, action_by=current_user)
            return jsonify(new_pc.to_dict()), 201
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': f"PC with name '{data['name']}' already exists."}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/pcs/<int:pc_id>', methods=['PUT'])
    @editor_required()
    def handle_pc_by_id_put(pc_id):
        current_user = get_jwt_identity()
        pc = PCService.get_by_id(pc_id)
        if not pc:
            return jsonify({'error': 'PC not found'}), 404
        data = request.json
        try:
            updated_pc = PCService.update(pc, data, action_by=current_user)
            return jsonify(updated_pc.to_dict())
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': f"PC with name '{data['name']}' already exists."}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/pcs/<int:pc_id>', methods=['DELETE'])
    @editor_required()
    def handle_pc_by_id_delete(pc_id):
        current_user = get_jwt_identity()
        pc = PCService.get_by_id(pc_id)
        if not pc:
            return jsonify({'error': 'PC not found'}), 404
        try:
            PCService.delete(pc, action_by=current_user)
            return jsonify({'message': 'PC deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # Patch Panel Endpoints
    @app.route('/patch_panels', methods=['POST'])
    @editor_required()
    def handle_patch_panels_post():
        current_user = get_jwt_identity()
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Patch Panel name is required'}), 400
        try:
            new_pp = PatchPanelService.create(data, action_by=current_user)
            return jsonify(new_pp.to_dict()), 201
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': f"Patch Panel with name '{data['name']}' already exists."}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/patch_panels/<int:pp_id>', methods=['PUT'])
    @editor_required()
    def handle_patch_panel_by_id_put(pp_id):
        current_user = get_jwt_identity()
        pp = PatchPanelService.get_by_id(pp_id)
        if not pp:
            return jsonify({'error': 'Patch Panel not found'}), 404
        data = request.json
        try:
            updated_pp = PatchPanelService.update(pp, data, action_by=current_user)
            return jsonify(updated_pp.to_dict())
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': f"Patch Panel with name '{data['name']}' already exists."}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/patch_panels/<int:pp_id>', methods=['DELETE'])
    @editor_required()
    def handle_patch_panel_by_id_delete(pp_id):
        current_user = get_jwt_identity()
        pp = PatchPanelService.get_by_id(pp_id)
        if not pp:
            return jsonify({'error': 'Patch Panel not found'}), 404
        try:
            PatchPanelService.delete(pp, action_by=current_user)
            return jsonify({'message': 'Patch Panel deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # Switch Endpoints
    @app.route('/switches', methods=['POST'])
    @editor_required()
    def handle_switches_post():
        current_user = get_jwt_identity()
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Switch name is required'}), 400
        try:
            new_switch = SwitchService.create(data, action_by=current_user)
            return jsonify(new_switch.to_dict()), 201
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': f"Switch with name '{data['name']}' already exists."}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/switches/<int:switch_id>', methods=['PUT'])
    @editor_required()
    def handle_switch_by_id_put(switch_id):
        current_user = get_jwt_identity()
        _switch = SwitchService.get_by_id(switch_id)
        if not _switch:
            return jsonify({'error': 'Switch not found'}), 404
        data = request.json
        try:
            updated_switch = SwitchService.update(_switch, data, action_by=current_user)
            return jsonify(updated_switch.to_dict())
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': f"Switch with name '{data['name']}' already exists."}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/switches/<int:switch_id>', methods=['DELETE'])
    @editor_required()
    def handle_switch_by_id_delete(switch_id):
        current_user = get_jwt_identity()
        _switch = SwitchService.get_by_id(switch_id)
        if not _switch:
            return jsonify({'error': 'Switch not found'}), 404
        try:
            SwitchService.delete(_switch, action_by=current_user)
            return jsonify({'message': 'Switch deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # Connection Endpoints
    @app.route('/connections', methods=['POST'])
    @editor_required()
    def handle_connections_post():
        current_user = get_jwt_identity()
        data = request.json
        try:
            new_connection = ConnectionService.create(data, action_by=current_user)
            return jsonify(new_connection.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/connections/<int:conn_id>', methods=['PUT'])
    @editor_required()
    def handle_connection_by_id_put(conn_id):
        current_user = get_jwt_identity()
        connection = ConnectionService.get_by_id(conn_id)
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        data = request.json
        try:
            updated_connection = ConnectionService.update(connection, data, action_by=current_user)
            return jsonify(updated_connection.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/connections/<int:conn_id>', methods=['DELETE'])
    @editor_required()
    def handle_connection_by_id_delete(conn_id):
        current_user = get_jwt_identity()
        connection = ConnectionService.get_by_id(conn_id)
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        try:
            ConnectionService.delete(connection, action_by=current_user)
            return jsonify({'message': 'Connection deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
            
    # PDF Template Management Endpoints
    # CORRECTED: Renamed function for consistency
    @app.route('/pdf_templates', methods=['GET'])
    @jwt_required()
    def handle_pdf_templates_get():
        templates = PdfTemplateService.get_all_pdf_templates()
        settings = AppSettingsService.get_app_settings()
        default_pdf_id = settings.default_pdf_id if settings else None
        return jsonify({
            'templates': [t.to_dict() for t in templates],
            'default_pdf_id': default_pdf_id
        })

    @app.route('/pdf_templates/upload', methods=['POST'])
    @admin_required()
    def upload_pdf_template():
        current_user = get_jwt_identity()
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        try:
            new_pdf = PdfTemplateService.upload_pdf_template(file, app.config, action_by=current_user)
            return jsonify({'message': 'File uploaded successfully', 'template': new_pdf.to_dict()}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to upload file: {str(e)}'}), 500

    @app.route('/pdf_templates/<int:pdf_id>', methods=['DELETE'])
    @editor_required()
    def delete_pdf_template(pdf_id):
        current_user = get_jwt_identity()
        pdf_template = PdfTemplateService.get_by_id(pdf_id)
        if not pdf_template:
            return jsonify({'error': 'PDF template not found'}), 404
        try:
            PdfTemplateService.delete_pdf_template(pdf_template, current_app.config['UPLOAD_FOLDER'], action_by=current_user)
            return jsonify({'message': 'PDF template deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to delete PDF template: {str(e)}'}), 500

    # ... (the rest of the routes remain the same) ...
    @app.route('/app_settings/default_pdf', methods=['POST'])
    @editor_required()
    def set_default_pdf():
        current_user = get_jwt_identity()
        data = request.json
        default_pdf_id = data.get('default_pdf_id')
        try:
            settings = AppSettingsService.set_default_pdf(default_pdf_id, action_by=current_user)
            return jsonify({'message': 'Default PDF template updated successfully', 'settings': settings.to_dict()}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to set default PDF: {str(e)}'}), 500

    @app.route('/app_settings', methods=['GET'])
    @jwt_required()
    def get_app_settings():
        settings = AppSettingsService.get_app_settings()
        if not settings:
            return jsonify({'default_pdf_id': None, 'default_pdf_name': None}), 200
        return jsonify(settings.to_dict()), 200

    @app.route('/pdf_templates/download/<string:stored_filename>', methods=['GET'])
    @jwt_required()
    def download_pdf_template(stored_filename):
        if not secure_filename(stored_filename) == stored_filename:
            return jsonify({'error': 'Invalid filename'}), 400
        try:
            return send_from_directory(current_app.config['UPLOAD_FOLDER'], stored_filename)
        except Exception as e:
            current_app.logger.error(f"Error serving PDF file {stored_filename}: {str(e)}")
            return jsonify({'error': 'File not found or access denied'}), 404
            
    # --- Catch-all for GET routes ---
    @app.route('/pcs', methods=['GET'])
    @jwt_required()
    def handle_pcs_get():
        pcs = PCService.get_all_pcs()
        return jsonify([pc.to_dict() for pc in pcs])
        
    @app.route('/patch_panels', methods=['GET'])
    @jwt_required()
    def handle_patch_panels_get():
        patch_panels = PatchPanelService.get_all_patch_panels()
        return jsonify([pp.to_dict() for pp in patch_panels])

    @app.route('/switches', methods=['GET'])
    @jwt_required()
    def handle_switches_get():
        switches = SwitchService.get_all_switches()
        return jsonify([_switch.to_dict() for _switch in switches])

    @app.route('/connections', methods=['GET'])
    @jwt_required()
    def handle_connections_get():
        connections = ConnectionService.get_all_connections()
        return jsonify([conn.to_dict() for conn in connections])

