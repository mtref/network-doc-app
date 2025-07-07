# backend/routes.py
# This file defines the Flask API endpoints and handles request/response logic.

import io
import csv
from flask import request, jsonify, make_response, send_from_directory, current_app
from sqlalchemy.exc import IntegrityError

from .extensions import db
from .services import (
    LocationService,
    RackService,
    PCService,
    PatchPanelService,
    SwitchService,
    ConnectionService,
    PdfTemplateService,
    AppSettingsService
)
# UPDATED: Import all necessary models for direct querying in routes
from .models import Location, Rack, PC, PatchPanel, Switch, Connection, ConnectionHop, PdfTemplate, AppSettings
from .utils import MAX_HOPS # Import MAX_HOPS for CSV export/import headers
from werkzeug.utils import secure_filename # For secure filenames

def register_routes(app):
    """
    Registers all API routes with the given Flask application instance.
    This function is called from the main app.py to set up the routes.
    """

    # Location Endpoints
    @app.route('/locations', methods=['GET', 'POST'])
    def handle_locations():
        if request.method == 'POST':
            data = request.json
            if not data or not data.get('name'):
                return jsonify({'error': 'Location name is required'}), 400
            try:
                # The service already handles the 'description' field from the data dict
                new_location = LocationService.create_location(data)
                return jsonify(new_location.to_dict()), 201
            except IntegrityError:
                db.session.rollback()
                return jsonify({'error': f"Location with name '{data['name']}' already exists."}), 409
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # GET
            locations = LocationService.get_all_locations()
            return jsonify([location.to_dict() for location in locations])

    @app.route('/locations/<int:location_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_location_by_id(location_id):
        location = LocationService.get_location_by_id(location_id)
        if not location:
            return jsonify({'error': 'Location not found'}), 404

        if request.method == 'GET':
            return jsonify(location.to_dict())
        elif request.method == 'PUT':
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided for update'}), 400
            try:
                # The service already handles the 'description' field from the data dict
                updated_location = LocationService.update_location(location, data)
                return jsonify(updated_location.to_dict())
            except IntegrityError:
                db.session.rollback()
                return jsonify({'error': f"Location with name '{data['name']}' already exists."}), 409
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # DELETE
            try:
                LocationService.delete_location(location)
                return jsonify({'message': 'Location deleted successfully'}), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    # Rack Endpoints
    @app.route('/racks', methods=['GET', 'POST'])
    def handle_racks():
        if request.method == 'POST':
            data = request.json
            if not data or not data.get('name') or not data.get('location_id'):
                return jsonify({'error': 'Rack name and location_id are required'}), 400
            try:
                new_rack = RackService.create_rack(data)
                return jsonify(new_rack.to_dict()), 201
            except IntegrityError as e:
                db.session.rollback()
                # Check for UniqueConstraint violation (name, location_id)
                if "UNIQUE constraint failed: racks.name, racks.location_id" in str(e):
                    return jsonify({'error': f"A rack with the name '{data['name']}' already exists in this location."}), 409
                return jsonify({'error': str(e)}), 500
            except ValueError as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 400
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # GET
            racks = RackService.get_all_racks()
            return jsonify([rack.to_dict() for rack in racks])

    @app.route('/racks/<int:rack_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_rack_by_id(rack_id):
        rack = RackService.get_rack_by_id(rack_id)
        if not rack:
            return jsonify({'error': 'Rack not found'}), 404

        if request.method == 'GET':
            return jsonify(rack.to_dict())
        elif request.method == 'PUT':
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided for update'}), 400
            try:
                updated_rack = RackService.update_rack(rack, data)
                return jsonify(updated_rack.to_dict())
            except IntegrityError as e:
                db.session.rollback()
                if "UNIQUE constraint failed: racks.name, racks.location_id" in str(e):
                    return jsonify({'error': f"A rack with the name '{data['name']}' already exists in this location."}), 409
                return jsonify({'error': str(e)}), 500
            except ValueError as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 409 # Use 409 Conflict for data integrity errors
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # DELETE
            try:
                RackService.delete_rack(rack)
                return jsonify({'message': 'Rack deleted successfully'}), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    # PC Endpoints
    @app.route('/pcs', methods=['GET', 'POST'])
    def handle_pcs():
        if request.method == 'POST':
            data = request.json
            if not data or not data.get('name'):
                return jsonify({'error': 'PC name is required'}), 400
            try:
                new_pc = PCService.create_pc(data)
                return jsonify(new_pc.to_dict()), 201
            except IntegrityError:
                db.session.rollback()
                return jsonify({'error': f"PC with name '{data['name']}' already exists."}), 409
            except ValueError as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 409
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # GET
            pcs = PCService.get_all_pcs()
            return jsonify([pc.to_dict() for pc in pcs])

    @app.route('/pcs/<int:pc_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_pc_by_id(pc_id):
        pc = PCService.get_pc_by_id(pc_id)
        if not pc:
            return jsonify({'error': 'PC not found'}), 404

        if request.method == 'GET':
            return jsonify(pc.to_dict())
        elif request.method == 'PUT':
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided for update'}), 400
            try:
                updated_pc = PCService.update_pc(pc, data)
                return jsonify(updated_pc.to_dict())
            except IntegrityError:
                db.session.rollback()
                return jsonify({'error': f"PC with name '{data['name']}' already exists."}), 409
            except ValueError as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 409
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # DELETE
            try:
                PCService.delete_pc(pc)
                return jsonify({'message': 'PC deleted successfully'}), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    @app.route('/available_pcs', methods=['GET'])
    def get_available_pcs():
        available_pcs = PCService.get_available_pcs()
        return jsonify([pc.to_dict() for pc in available_pcs])

    # Patch Panel Endpoints
    @app.route('/patch_panels', methods=['GET', 'POST'])
    def handle_patch_panels():
        if request.method == 'POST':
            data = request.json
            if not data or not data.get('name'):
                return jsonify({'error': 'Patch Panel name is required'}), 400
            try:
                new_pp = PatchPanelService.create_patch_panel(data)
                return jsonify(new_pp.to_dict()), 201
            except IntegrityError:
                db.session.rollback()
                return jsonify({'error': f"Patch Panel with name '{data['name']}' already exists."}), 409
            except ValueError as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 409
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # GET
            patch_panels = PatchPanelService.get_all_patch_panels()
            return jsonify([pp.to_dict() for pp in patch_panels])

    @app.route('/patch_panels/<int:pp_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_patch_panel_by_id(pp_id):
        pp = PatchPanelService.get_patch_panel_by_id(pp_id)
        if not pp:
            return jsonify({'error': 'Patch Panel not found'}), 404

        if request.method == 'GET':
            return jsonify(pp.to_dict())
        elif request.method == 'PUT':
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided for update'}), 400
            try:
                updated_pp = PatchPanelService.update_patch_panel(pp, data)
                return jsonify(updated_pp.to_dict())
            except IntegrityError:
                db.session.rollback()
                return jsonify({'error': f"Patch Panel with name '{data['name']}' already exists."}), 409
            except ValueError as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 409
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # DELETE
            try:
                PatchPanelService.delete_patch_panel(pp)
                return jsonify({'message': 'Patch Panel deleted successfully'}), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    @app.route('/patch_panels/<int:pp_id>/ports', methods=['GET'])
    def get_patch_panel_ports(pp_id):
        ports_status = PatchPanelService.get_patch_panel_ports_status(pp_id)
        if ports_status is None:
            return jsonify({'error': 'Patch Panel not found'}), 404
        return jsonify(ports_status)

    # Switch Endpoints
    @app.route('/switches', methods=['GET', 'POST'])
    def handle_switches():
        if request.method == 'POST':
            data = request.json
            if not data or not data.get('name'):
                return jsonify({'error': 'Switch name is required'}), 400
            try:
                new_switch = SwitchService.create_switch(data)
                return jsonify(new_switch.to_dict()), 201
            except IntegrityError:
                db.session.rollback()
                return jsonify({'error': f"Switch with name '{data['name']}' already exists."}), 409
            except ValueError as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 409
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # GET
            switches = SwitchService.get_all_switches()
            return jsonify([_switch.to_dict() for _switch in switches])

    @app.route('/switches/<int:switch_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_switch_by_id(switch_id):
        _switch = SwitchService.get_switch_by_id(switch_id)
        if not _switch:
            return jsonify({'error': 'Switch not found'}), 404

        if request.method == 'GET':
            return jsonify(_switch.to_dict())
        elif request.method == 'PUT':
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided for update'}), 400
            try:
                updated_switch = SwitchService.update_switch(_switch, data)
                return jsonify(updated_switch.to_dict())
            except IntegrityError:
                db.session.rollback()
                return jsonify({'error': f"Switch with name '{data['name']}' already exists."}), 409
            except ValueError as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 409
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # DELETE
            try:
                SwitchService.delete_switch(_switch)
                return jsonify({'message': 'Switch deleted successfully'}), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    @app.route('/switches/<int:switch_id>/ports', methods=['GET'])
    def get_switch_ports(switch_id):
        ports_status = SwitchService.get_switch_ports_status(switch_id)
        if ports_status is None:
            return jsonify({'error': 'Switch not found'}), 404
        return jsonify(ports_status)

    # Connection Endpoints
    @app.route('/connections', methods=['GET', 'POST'])
    def handle_connections():
        if request.method == 'POST':
            data = request.json
            required_fields = ['pc_id', 'switch_id', 'switch_port', 'is_switch_port_up', 'hops']
            if not all(field in data for field in required_fields):
                return jsonify({'error': 'Missing required fields for connection'}), 400
            try:
                new_connection = ConnectionService.create_connection(data)
                return jsonify(new_connection.to_dict()), 201
            except ValueError as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 409
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # GET
            connections = ConnectionService.get_all_connections()
            return jsonify([conn.to_dict() for conn in connections])

    @app.route('/connections/<int:conn_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_connection_by_id(conn_id):
        connection = ConnectionService.get_connection_by_id(conn_id)
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404

        if request.method == 'GET':
            return jsonify(connection.to_dict())
        elif request.method == 'PUT':
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided for update'}), 400
            try:
                updated_connection = ConnectionService.update_connection(connection, data)
                return jsonify(updated_connection.to_dict())
            except ValueError as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 409
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500
        else: # DELETE
            try:
                ConnectionService.delete_connection(connection)
                return jsonify({'message': 'Connection deleted successfully'}), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    # CSV Export Endpoints
    @app.route('/export/<entity_type>', methods=['GET'])
    def export_data(entity_type):
        si = io.StringIO()
        cw = csv.writer(si)

        headers = []
        data_rows = []
        filename = f'{entity_type}.csv'
        errors = [] # Collect errors during export if any

        try:
            if entity_type == 'locations':
                # ADDED: 'description' to headers
                headers = ['id', 'name', 'door_number', 'description']
                items = LocationService.get_all_locations()
                # ADDED: item.description to data row
                data_rows = [[item.id, item.name, item.door_number, item.description] for item in items]
            elif entity_type == 'racks':
                headers = ['id', 'name', 'location_id', 'location_name', 'location_door_number', 'description', 'total_units', 'orientation']
                items = RackService.get_all_racks()
                data_rows = [[r.id, r.name, r.location_id, r.location.name if r.location else '', r.location.door_number if r.location else '', r.description, r.total_units, r.orientation] for r in items]
            elif entity_type == 'pcs':
                # UPDATED: Add 'units_occupied' to PC export headers
                headers = ['id', 'name', 'ip_address', 'username', 'in_domain', 'operating_system', 'model', 'office', 'description', 'multi_port', 'type', 'usage', 'row_in_rack', 'units_occupied', 'rack_id', 'rack_name']
                items = PCService.get_all_pcs()
                # UPDATED: Add 'units_occupied' to PC export data
                data_rows = [[pc.id, pc.name, pc.ip_address, pc.username, pc.in_domain, pc.operating_system, pc.model, pc.office, pc.description, pc.multi_port, pc.type, pc.usage, pc.row_in_rack, pc.units_occupied, pc.rack_id, pc.rack.name if pc.rack else ''] for pc in items]
            elif entity_type == 'patch_panels':
                # UPDATED: Add 'units_occupied' to Patch Panel export headers
                headers = ['id', 'name', 'location_id', 'location_name', 'location_door_number', 'row_in_rack', 'units_occupied', 'rack_id', 'rack_name', 'total_ports', 'description']
                items = PatchPanelService.get_all_patch_panels()
                # UPDATED: Add 'units_occupied' to Patch Panel export data
                data_rows = [[pp.id, pp.name, pp.location_id, pp.location.name if pp.location else '', pp.location.door_number if pp.location else '', pp.row_in_rack, pp.units_occupied, pp.rack_id, pp.rack.name if pp.rack else '', pp.total_ports, pp.description] for pp in items]
            elif entity_type == 'switches':
                # UPDATED: Add 'units_occupied' to Switch export headers
                headers = ['id', 'name', 'ip_address', 'location_id', 'location_name', 'location_door_number', 'row_in_rack', 'units_occupied', 'rack_id', 'rack_name', 'total_ports', 'source_port', 'model', 'description', 'usage']
                items = SwitchService.get_all_switches()
                # UPDATED: Add 'units_occupied' to Switch export data
                data_rows = [[s.id, s.name, s.ip_address, s.location_id, s.location.name if s.location else '', s.location.door_number if s.location else '', s.row_in_rack, s.units_occupied, s.rack_id, s.rack.name if s.rack else '', s.total_ports, s.source_port, s.model, s.description, s.usage] for s in items]
            elif entity_type == 'connections':
                headers = [
                    'connection_id', 'pc_id', 'pc_name', 'pc_ip_address', 'cable_color', 'cable_label',
                    'switch_id', 'switch_name', 'switch_ip_address',
                    'switch_port', 'is_switch_port_up',
                ]
                for i in range(MAX_HOPS):
                    headers.extend([
                        f'hop{i+1}_patch_panel_id', f'hop{i+1}_patch_panel_name', f'hop{i+1}_patch_panel_location_name', f'hop{i+1}_patch_panel_location_door_number', f'hop{i+1}_patch_panel_row_in_rack', f'hop{i+1}_patch_panel_rack_id', f'hop{i+1}_patch_panel_rack_name',
                        f'hop{i+1}_patch_panel_port', f'hop{i+1}_is_port_up',
                        f'hop{i+1}_cable_color', f'hop{i+1}_cable_label'
                    ])

                all_connections = ConnectionService.get_all_connections()

                for conn in all_connections:
                    row = [
                        conn.id,
                        conn.pc.id if conn.pc else '',
                        conn.pc.name if conn.pc else '',
                        conn.pc.ip_address if conn.pc else '',
                        conn.cable_color,
                        conn.cable_label,
                        conn.switch.id if conn.switch else '',
                        conn.switch.name if conn.switch else '',
                        conn.switch.ip_address if conn.switch else '',
                        conn.switch_port,
                        conn.is_switch_port_up,
                    ]
                    for i in range(MAX_HOPS):
                        if i < len(conn.hops):
                            hop = conn.hops[i]
                            row.extend([
                                hop.patch_panel.id if hop.patch_panel else '',
                                hop.patch_panel.name if hop.patch_panel else '',
                                hop.patch_panel.location.name if hop.patch_panel and hop.patch_panel.location else '',
                                hop.patch_panel.location.door_number if hop.patch_panel and hop.patch_panel.location else '',
                                hop.patch_panel.row_in_rack if hop.patch_panel else '',
                                hop.patch_panel.rack_id if hop.patch_panel else '',
                                hop.patch_panel.rack.name if hop.patch_panel and hop.patch_panel.rack else '',
                                hop.patch_panel_port,
                                hop.is_port_up,
                                hop.cable_color,
                                hop.cable_label
                            ])
                        else:
                            row.extend([''] * 11) # Fill with empty strings for missing hop details
                    data_rows.append(row)
            else:
                return jsonify({'error': 'Invalid entity type for export.'}), 400

            cw.writerow(headers)
            cw.writerows(data_rows)

            output = make_response(si.getvalue())
            output.headers["Content-Disposition"] = f"attachment; filename={filename}"
            output.headers["Content-type"] = "text/csv"
            return output

        except Exception as e:
            app.logger.error(f"Error during CSV export for {entity_type}: {str(e)}")
            return jsonify({'error': f'Failed to export {entity_type} data: {str(e)}'}), 500

    # CSV Import Endpoint
    @app.route('/import/<entity_type>', methods=['POST'])
    def import_data(entity_type):
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request.'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file.'}), 400
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Invalid file type. Please upload a CSV file.'}), 400

        stream = io.StringIO(file.stream.read().decode("UTF8"))
        reader = csv.reader(stream)
        header = [h.strip() for h in next(reader)] # Read header row and strip whitespace
        
        success_count = 0
        error_count = 0
        errors = []

        try:
            for i, row_data in enumerate(reader):
                if not row_data: continue
                row_dict = dict(zip(header, row_data))
                
                db.session.begin_nested() # Start a nested transaction for each row

                try:
                    if entity_type == 'locations':
                        name = row_dict.get('name')
                        if not name:
                            raise ValueError("Missing 'name' field.")
                        # Check for existing location by name before creating
                        existing_location = db.session.query(Location).filter_by(name=name).first()
                        if existing_location:
                            raise ValueError(f"Location '{name}' already exists. Skipped.")
                        
                        # The service will pick up the 'description' from row_dict if present
                        LocationService.create_location(row_dict)

                    elif entity_type == 'racks':
                        name = row_dict.get('name')
                        location_name = row_dict.get('location_name')
                        if not name or not location_name:
                            raise ValueError("Missing 'name' or 'location_name' field.")
                        
                        location = db.session.query(Location).filter_by(name=location_name).first()
                        if not location:
                            raise ValueError(f"Location '{location_name}' not found for Rack '{name}'. Skipped.")

                        existing_rack = db.session.query(Rack).filter_by(name=name, location_id=location.id).first()
                        if existing_rack:
                            raise ValueError(f"Rack '{name}' already exists in this location. Skipped.")

                        rack_data = {
                            'name': name,
                            'location_id': location.id, 
                            'description': row_dict.get('description'),
                            'total_units': int(row_dict.get('total_units', 42)),
                            'orientation': row_dict.get('orientation', 'bottom-up'),
                        }
                        RackService.create_rack(rack_data)

                    elif entity_type == 'pcs':
                        name = row_dict.get('name')
                        if not name:
                            raise ValueError("Missing 'name' field.")

                        pc_type = row_dict.get('type', 'Workstation')
                        rack_id = None
                        row_in_rack = None 
                        units_occupied = 1 
                        rack_name = row_dict.get('rack_name')

                        if pc_type == 'Server' and rack_name:
                            rack = db.session.query(Rack).filter_by(name=rack_name).first()
                            if not rack:
                                errors.append(f"Row {i+2}: Rack '{rack_name}' not found for PC '{name}'. Rack link skipped.")
                            else:
                                rack_id = rack.id
                                try:
                                    row_in_rack = int(row_dict.get('row_in_rack')) if row_dict.get('row_in_rack') else None
                                    units_occupied = int(row_dict.get('units_occupied', 1))
                                    if row_in_rack is None or row_in_rack < 1 or units_occupied < 1:
                                        raise ValueError("Invalid 'row_in_rack' or 'units_occupied'. Must be positive integers for Server PCs.")
                                except (ValueError, TypeError):
                                    raise ValueError("Invalid 'row_in_rack' or 'units_occupied'. Must be positive integers for Server PCs.")

                                is_occupied, conflicting_device = validate_rack_unit_occupancy(
                                    db.session,
                                    rack_id=rack_id,
                                    start_row_in_rack=row_in_rack,
                                    units_occupied=units_occupied,
                                    device_type='pc'
                                )
                                if is_occupied:
                                    raise ValueError(f"Rack unit(s) is already occupied by {conflicting_device}. PC '{name}' skipped.")
                        
                        if pc_type != 'Server':
                            rack_id = None
                            row_in_rack = None
                            units_occupied = 1 

                        existing_pc = db.session.query(PC).filter_by(name=name).first() 
                        if existing_pc:
                            update_data = {
                                'ip_address': row_dict.get('ip_address', existing_pc.ip_address),
                                'username': row_dict.get('username', existing_pc.username),
                                'in_domain': row_dict.get('in_domain', str(existing_pc.in_domain)).lower() == 'true',
                                'operating_system': row_dict.get('operating_system', existing_pc.operating_system),
                                'model': row_dict.get('model', existing_pc.model),
                                'office': row_dict.get('office', existing_pc.office),
                                'description': row_dict.get('description', existing_pc.description),
                                'multi_port': row_dict.get('multi_port', str(existing_pc.multi_port)).lower() == 'true',
                                'type': pc_type,
                                'usage': row_dict.get('usage', existing_pc.usage),
                                'row_in_rack': row_in_rack,
                                'rack_id': rack_id,
                                'units_occupied': units_occupied, 
                            }
                            PCService.update_pc(existing_pc, update_data)
                        else:
                            create_data = {
                                'name': name,
                                'ip_address': row_dict.get('ip_address'),
                                'username': row_dict.get('username'),
                                'in_domain': row_dict.get('in_domain', 'False').lower() == 'true',
                                'operating_system': row_dict.get('operating_system'),
                                'model': row_dict.get('model'),
                                'office': row_dict.get('office'),
                                'description': row_dict.get('description'),
                                'multi_port': row_dict.get('multi_port', 'False').lower() == 'true',
                                'type': pc_type,
                                'usage': row_dict.get('usage'),
                                'row_in_rack': row_in_rack,
                                'rack_id': rack_id,
                                'units_occupied': units_occupied, 
                            }
                            PCService.create_pc(create_data)

                    elif entity_type == 'patch_panels':
                        name = row_dict.get('name')
                        location_name = row_dict.get('location_name')
                        if not name or not location_name:
                            raise ValueError("Missing 'name' or 'location_name' field.")

                        location = db.session.query(Location).filter_by(name=location_name).first()
                        if not location:
                            raise ValueError(f"Location '{location_name}' not found for Patch Panel '{name}'. Skipped.")

                        rack_id = None
                        row_in_rack = None
                        units_occupied = 1
                        rack_name = row_dict.get('rack_name')

                        if rack_name:
                            rack = db.session.query(Rack).filter_by(name=rack_name).first()
                            if not rack:
                                errors.append(f"Row {i+2}: Rack '{rack_name}' not found for Patch Panel '{name}'. Linking to Rack skipped.")
                            else:
                                rack_id = rack.id
                                try:
                                    row_in_rack = int(row_dict.get('row_in_rack')) if row_dict.get('row_in_rack') else None
                                    units_occupied = int(row_dict.get('units_occupied', 1))
                                    if row_in_rack is None or row_in_rack < 1 or units_occupied < 1:
                                        raise ValueError("Invalid 'row_in_rack' or 'units_occupied'. Must be positive integers for rack-mounted Patch Panel.")
                                except (ValueError, TypeError):
                                    raise ValueError("Invalid 'row_in_rack' or 'units_occupied'. Must be positive integers for rack-mounted Patch Panel.")

                                is_occupied, conflicting_device = validate_rack_unit_occupancy(
                                    db.session,
                                    rack_id=rack_id,
                                    start_row_in_rack=row_in_rack,
                                    units_occupied=units_occupied,
                                    device_type='patch_panel'
                                )
                                if is_occupied:
                                    raise ValueError(f"Rack unit(s) is already occupied by {conflicting_device}. Patch Panel '{name}' skipped.")

                        existing_pp = db.session.query(PatchPanel).filter_by(name=name).first() 
                        if existing_pp:
                            raise ValueError(f"Patch Panel '{name}' already exists. Skipped.")
                        
                        pp_data = {
                            'name': name,
                            'location_id': location.id,
                            'rack_id': rack_id,
                            'row_in_rack': row_in_rack,
                            'units_occupied': units_occupied, 
                            'total_ports': int(row_dict.get('total_ports', 1)),
                            'description': row_dict.get('description')
                        }
                        PatchPanelService.create_patch_panel(pp_data)

                    elif entity_type == 'switches':
                        name = row_dict.get('name')
                        location_name = row_dict.get('location_name')
                        if not name or not location_name:
                            raise ValueError("Missing 'name' or 'location_name' field.")

                        location = db.session.query(Location).filter_by(name=location_name).first()
                        if not location:
                            raise ValueError(f"Location '{location_name}' not found for Switch '{name}'. Skipped.")

                        rack_id = None
                        row_in_rack = None
                        units_occupied = 1
                        rack_name = row_dict.get('rack_name')

                        if rack_name:
                            rack = db.session.query(Rack).filter_by(name=rack_name).first()
                            if not rack:
                                errors.append(f"Row {i+2}: Rack '{rack_name}' not found for Switch '{name}'. Linking to Rack skipped.")
                            else:
                                rack_id = rack.id
                                try:
                                    row_in_rack = int(row_dict.get('row_in_rack')) if row_dict.get('row_in_rack') else None
                                    units_occupied = int(row_dict.get('units_occupied', 1))
                                    if row_in_rack is None or row_in_rack < 1 or units_occupied < 1:
                                        raise ValueError("Invalid 'row_in_rack' or 'units_occupied'. Must be positive integers for rack-mounted Switch.")
                                except (ValueError, TypeError):
                                    raise ValueError("Invalid 'row_in_rack' or 'units_occupied'. Must be positive integers for rack-mounted Switch.")

                                is_occupied, conflicting_device = validate_rack_unit_occupancy(
                                    db.session,
                                    rack_id=rack_id,
                                    start_row_in_rack=row_in_rack,
                                    units_occupied=units_occupied,
                                    device_type='switch'
                                )
                                if is_occupied:
                                    raise ValueError(f"Rack unit(s) is already occupied by {conflicting_device}. Switch '{name}' skipped.")

                        existing_switch = db.session.query(Switch).filter_by(name=name).first() 
                        if existing_switch:
                            raise ValueError(f"Switch '{name}' already exists. Skipped.")
                        
                        switch_data = {
                            'name': name,
                            'ip_address': row_dict.get('ip_address'),
                            'location_id': location.id,
                            'rack_id': rack_id,
                            'row_in_rack': row_in_rack,
                            'units_occupied': units_occupied, 
                            'total_ports': int(row_dict.get('total_ports', 1)),
                            'source_port': row_dict.get('source_port'),
                            'model': row_dict.get('model'),
                            'description': row_dict.get('description'),
                            'usage': row_dict.get('usage')
                        }
                        SwitchService.create_switch(switch_data)

                    elif entity_type == 'connections':
                        pc_name = row_dict.get('pc_name')
                        switch_name = row_dict.get('switch_name')
                        switch_port = row_dict.get('switch_port')
                        is_switch_port_up = row_dict.get('is_switch_port_up', 'True').lower() == 'true'
                        cable_color = row_dict.get('cable_color')
                        cable_label = row_dict.get('cable_label')

                        if not pc_name or not switch_name or not switch_port:
                            raise ValueError("Missing 'pc_name', 'switch_name', or 'switch_port'. Skipped.")

                        pc = db.session.query(PC).filter_by(name=pc_name).first()
                        _switch = db.session.query(Switch).filter_by(name=switch_name).first()

                        if not pc:
                            raise ValueError(f"PC '{pc_name}' not found. Skipped connection.")
                        if not _switch:
                            raise ValueError(f"Switch '{switch_name}' not found. Skipped connection.")
                        
                        existing_connection = db.session.query(Connection).filter_by(
                            pc_id=pc.id,
                            switch_id=_switch.id,
                            switch_port=switch_port
                        ).first()

                        if existing_connection:
                            raise ValueError(f"Connection between PC '{pc_name}', Switch '{switch_name}' port '{switch_port}' already exists. Skipped.")

                        connection_data = {
                            'pc_id': pc.id,
                            'switch_id': _switch.id,
                            'switch_port': switch_port,
                            'is_switch_port_up': is_switch_port_up,
                            'cable_color': cable_color,
                            'cable_label': cable_label,
                            'hops': []
                        }

                        for j in range(MAX_HOPS):
                            pp_name_col = f'hop{j+1}_patch_panel_name'
                            pp_port_col = f'hop{j+1}_patch_panel_port'
                            is_hop_port_up_col = f'hop{j+1}_is_port_up'
                            hop_cable_color_col = f'hop{j+1}_cable_color'
                            hop_cable_label_col = f'hop{j+1}_cable_label'

                            pp_name = row_dict.get(pp_name_col)
                            pp_port = row_dict.get(pp_port_col)
                            is_hop_port_up = row_dict.get(is_hop_port_up_col, 'True').lower() == 'true'
                            hop_cable_color = row_dict.get(hop_cable_color_col)
                            hop_cable_label = row_dict.get(hop_cable_label_col)

                            if pp_name and pp_port:
                                patch_panel = db.session.query(PatchPanel).filter_by(name=pp_name).first()
                                if not patch_panel:
                                    errors.append(f"Row {i+2}, Hop {j+1}: Patch Panel '{pp_name}' not found. Skipping this hop.")
                                    continue
                                connection_data['hops'].append({
                                    'patch_panel_id': patch_panel.id,
                                    'patch_panel_port': pp_port,
                                    'is_port_up': is_hop_port_up,
                                    'sequence': j,
                                    'cable_color': hop_cable_color,
                                    'cable_label': hop_cable_label
                                })
                        
                        ConnectionService.create_connection(connection_data)

                    else:
                        raise ValueError('Invalid entity type for import.')
                    
                    db.session.commit() 
                    success_count += 1

                except ValueError as e:
                    db.session.rollback() 
                    errors.append(f"Row {i+2}: {str(e)}")
                    error_count += 1
                except IntegrityError as e:
                    db.session.rollback()
                    errors.append(f"Row {i+2}: Database integrity error - {str(e)}")
                    error_count += 1
                except Exception as e:
                    db.session.rollback()
                    errors.append(f"Row {i+2}: An unexpected error occurred - {str(e)}")
                    error_count += 1

        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error during CSV import for {entity_type}: {str(e)}")
            return jsonify({'error': f'Failed to import data: {str(e)}', 'details': errors}), 500

        return jsonify({
            'message': f'Import completed. {success_count} records processed successfully.',
            'errors': errors,
            'error_count': error_count,
            'success_count': success_count
        }), 200

    # PDF Template Management Endpoints
    @app.route('/pdf_templates', methods=['GET'])
    def list_pdf_templates():
        templates = PdfTemplateService.get_all_pdf_templates()
        settings = AppSettingsService.get_app_settings()
        default_pdf_id = settings.default_pdf_id if settings else None

        return jsonify({
            'templates': [t.to_dict() for t in templates],
            'default_pdf_id': default_pdf_id
        })

    @app.route('/pdf_templates/upload', methods=['POST'])
    def upload_pdf_template():
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        try:
            new_pdf = PdfTemplateService.upload_pdf_template(file, app.config)
            return jsonify({'message': 'File uploaded successfully', 'template': new_pdf.to_dict()}), 201
        except ValueError as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error uploading PDF: {str(e)}")
            return jsonify({'error': f'Failed to upload file: {str(e)}'}), 500

    @app.route('/pdf_templates/<int:pdf_id>', methods=['DELETE'])
    def delete_pdf_template(pdf_id):
        pdf_template = PdfTemplateService.get_pdf_template_by_id(pdf_id)
        if not pdf_template:
            return jsonify({'error': 'PDF template not found'}), 404

        try:
            PdfTemplateService.delete_pdf_template(pdf_template, current_app.config['UPLOAD_FOLDER'])
            return jsonify({'message': 'PDF template deleted successfully'}), 200
        except ValueError as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error deleting PDF template: {str(e)}")
            return jsonify({'error': f'Failed to delete PDF template: {str(e)}'}), 500

    @app.route('/app_settings/default_pdf', methods=['POST'])
    def set_default_pdf():
        data = request.json
        default_pdf_id = data.get('default_pdf_id')
        
        try:
            settings = AppSettingsService.set_default_pdf(default_pdf_id)
            return jsonify({'message': 'Default PDF template updated successfully', 'settings': settings.to_dict()}), 200
        except ValueError as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 404
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error setting default PDF: {str(e)}")
            return jsonify({'error': f'Failed to set default PDF: {str(e)}'}), 500

    @app.route('/app_settings', methods=['GET'])
    def get_app_settings():
        settings = AppSettingsService.get_app_settings()
        if not settings:
            return jsonify({'default_pdf_id': None, 'default_pdf_name': None}), 200
        return jsonify(settings.to_dict()), 200

    @app.route('/pdf_templates/download/<string:stored_filename>', methods=['GET'])
    def download_pdf_template(stored_filename):
        if not secure_filename(stored_filename) == stored_filename:
            return jsonify({'error': 'Invalid filename'}), 400
        
        try:
            return send_from_directory(current_app.config['UPLOAD_FOLDER'], stored_filename)
        except Exception as e:
            current_app.logger.error(f"Error serving PDF file {stored_filename}: {str(e)}")
            return jsonify({'error': 'File not found or access denied'}), 404
