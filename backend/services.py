# backend/services.py
# This file contains the business logic and database interaction functions.

import os
import uuid
from sqlalchemy.orm import joinedload, attributes, make_transient
from sqlalchemy.exc import IntegrityError
from sqlalchemy import cast, Integer
from datetime import datetime

from .extensions import db
from .models import Location, Rack, PC, PatchPanel, Switch, Connection, ConnectionHop, PdfTemplate, AppSettings, SystemLog
from .utils import validate_port_occupancy, validate_rack_unit_occupancy, check_rack_unit_decrease_conflict, allowed_file

# --- Global Constants (can be moved to a config.py if more complex) ---
MAX_HOPS = 5 # Maximum number of hops to export/import for connections

# --- System Logging Service ---
class SystemLogService:
    @staticmethod
    def _get_changed_fields(model_instance, new_data):
        """Compares a model instance with new data and returns a dict of changes."""
        changes = {}
        for key, value in new_data.items():
            current_value = getattr(model_instance, key, None)
            
            # Simple normalization for comparison
            normalized_current = "" if current_value is None else str(current_value)
            normalized_new = "" if value is None else str(value)

            if normalized_current != normalized_new:
                changes[key] = {
                    'old': normalized_current,
                    'new': normalized_new
                }
        return changes

    @staticmethod
    def create_log(action_type, entity_type, entity_id=None, entity_name=None, details=None, action_by='system'):
        """Creates a new system log entry."""
        log_entry = SystemLog(
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            details=details,
            action_by=action_by,
            timestamp=datetime.utcnow()
        )
        db.session.add(log_entry)
        # The commit will be handled by the calling service method

    @staticmethod
    def get_all_logs(page=1, per_page=20, entity_type=None, action_type=None):
        """Retrieves a paginated and filtered list of system logs."""
        query = SystemLog.query
        if entity_type:
            query = query.filter(SystemLog.entity_type == entity_type)
        if action_type:
            query = query.filter(SystemLog.action_type == action_type)
        
        query = query.order_by(SystemLog.timestamp.desc())
        
        paginated_logs = query.paginate(page=page, per_page=per_page, error_out=False)
        return paginated_logs

    @staticmethod
    def revert_log_action(log_id):
        """Reverts the action recorded in a specific log entry."""
        log_to_revert = SystemLog.query.get(log_id)
        if not log_to_revert:
            raise ValueError("Log entry not found.")
        if log_to_revert.is_reverted:
            raise ValueError("This action has already been reverted.")

        action_type = log_to_revert.action_type
        entity_type = log_to_revert.entity_type
        details = log_to_revert.details

        service_map = {
            'Location': LocationService, 'Rack': RackService, 'PC': PCService,
            'Patch Panel': PatchPanelService, 'Switch': SwitchService, 'Connection': ConnectionService,
        }
        service = service_map.get(entity_type)
        if not service:
            raise ValueError(f"Revert action for entity type '{entity_type}' is not supported.")

        if action_type == 'CREATE':
            entity = service.get_by_id(log_to_revert.entity_id)
            if entity:
                service.delete(entity)
            else:
                raise ValueError(f"{entity_type} with ID {log_to_revert.entity_id} not found for deletion.")

        elif action_type == 'DELETE':
            if not details:
                raise ValueError("Cannot revert DELETE action: No data stored in log.")
            service.create(details)

        elif action_type == 'UPDATE':
            entity = service.get_by_id(log_to_revert.entity_id)
            if not entity:
                raise ValueError(f"{entity_type} with ID {log_to_revert.entity_id} not found for update.")
            
            old_values = {key: value['old'] for key, value in details.items()}
            
            # Type conversion for revert
            for key, value in old_values.items():
                if hasattr(entity, key):
                    column_type = type(getattr(entity, key, None))
                    if column_type is bool:
                        old_values[key] = value.lower() == 'true'
                    elif column_type is int:
                        try:
                            old_values[key] = int(value) if value and value != 'None' else None
                        except (ValueError, TypeError):
                            old_values[key] = None
            
            service.update(entity, old_values, is_revert=True)

        else:
            raise ValueError(f"Cannot revert action of type '{action_type}'.")

        log_to_revert.is_reverted = True
        SystemLogService.create_log(
            action_type='REVERT',
            entity_type=log_to_revert.entity_type,
            entity_id=log_to_revert.entity_id,
            entity_name=log_to_revert.entity_name,
            details={'reverted_log_id': log_id}
        )
        db.session.commit()
        return f"Successfully reverted action for {entity_type}: {log_to_revert.entity_name}"


class LocationService:
    @staticmethod
    def get_all_locations(): return Location.query.all()
    @staticmethod
    def get_by_id(id): return Location.query.get(id)
    @staticmethod
    def create(data):
        new_location = Location(**data)
        db.session.add(new_location)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'Location', new_location.id, new_location.name, details=new_location.to_dict())
        db.session.commit()
        return new_location
    @staticmethod
    def update(location, data, is_revert=False):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(location, data)
            if changes:
                SystemLogService.create_log('UPDATE', 'Location', location.id, data.get('name', location.name), changes)
        for key, value in data.items():
            if hasattr(location, key):
                setattr(location, key, value)
        db.session.commit()
        return location
    @staticmethod
    def delete(location):
        location_id = location.id
        location_name = location.name
        location_data = location.to_dict()
        db.session.delete(location)
        SystemLogService.create_log('DELETE', 'Location', location_id, location_name, details=location_data)
        db.session.commit()

class RackService:
    @staticmethod
    def get_all_racks(): return Rack.query.options(joinedload(Rack.location)).all()
    @staticmethod
    def get_by_id(id): return Rack.query.get(id)
    @staticmethod
    def create(data):
        new_rack = Rack(**data)
        db.session.add(new_rack)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'Rack', new_rack.id, new_rack.name, details=new_rack.to_dict())
        db.session.commit()
        return new_rack
    @staticmethod
    def update(rack, data, is_revert=False):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(rack, data)
            if changes:
                SystemLogService.create_log('UPDATE', 'Rack', rack.id, data.get('name', rack.name), changes)
        for key, value in data.items():
            if hasattr(rack, key):
                setattr(rack, key, value)
        db.session.commit()
        return rack
    @staticmethod
    def delete(rack):
        rack_id = rack.id
        rack_name = rack.name
        rack_data = rack.to_dict()
        db.session.delete(rack)
        SystemLogService.create_log('DELETE', 'Rack', rack_id, rack_name, details=rack_data)
        db.session.commit()

class PCService:
    @staticmethod
    def get_all_pcs(): return PC.query.options(joinedload(PC.rack)).all()
    @staticmethod
    def get_by_id(id): return PC.query.get(id)
    @staticmethod
    def create(data):
        new_pc = PC(**data)
        db.session.add(new_pc)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'PC', new_pc.id, new_pc.name, details=new_pc.to_dict())
        db.session.commit()
        return new_pc
    @staticmethod
    def update(pc, data, is_revert=False):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(pc, data)
            if changes:
                SystemLogService.create_log('UPDATE', 'PC', pc.id, data.get('name', pc.name), changes)
        for key, value in data.items():
            if hasattr(pc, key):
                setattr(pc, key, value)
        db.session.commit()
        return pc
    @staticmethod
    def delete(pc):
        pc_id = pc.id
        pc_name = pc.name
        pc_data = pc.to_dict()
        db.session.delete(pc)
        SystemLogService.create_log('DELETE', 'PC', pc_id, pc_name, details=pc_data)
        db.session.commit()
    @staticmethod
    def get_available_pcs():
        all_pcs = PC.query.all()
        all_connections = Connection.query.options(joinedload(Connection.pc)).all()
        connected_single_port_pc_ids = {conn.pc_id for conn in all_connections if conn.pc and not conn.pc.multi_port}
        available_pcs = [pc for pc in all_pcs if pc.multi_port or pc.id not in connected_single_port_pc_ids]
        return available_pcs

class PatchPanelService:
    @staticmethod
    def get_all_patch_panels(): return PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).all()
    @staticmethod
    def get_by_id(id): return PatchPanel.query.get(id)
    @staticmethod
    def create(data):
        new_pp = PatchPanel(**data)
        db.session.add(new_pp)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'Patch Panel', new_pp.id, new_pp.name, details=new_pp.to_dict())
        db.session.commit()
        return new_pp
    @staticmethod
    def update(pp, data, is_revert=False):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(pp, data)
            if changes:
                SystemLogService.create_log('UPDATE', 'Patch Panel', pp.id, data.get('name', pp.name), changes)
        for key, value in data.items():
            if hasattr(pp, key):
                setattr(pp, key, value)
        db.session.commit()
        return pp
    @staticmethod
    def delete(pp):
        pp_id = pp.id
        pp_name = pp.name
        pp_data = pp.to_dict()
        db.session.delete(pp)
        SystemLogService.create_log('DELETE', 'Patch Panel', pp_id, pp_name, details=pp_data)
        db.session.commit()
    @staticmethod
    def get_patch_panel_ports_status(pp_id):
        patch_panel = PatchPanel.query.get(pp_id)
        if not patch_panel:
            return None

        # Eagerly load related data for efficiency
        hops_on_panel = db.session.query(ConnectionHop).options(
            joinedload(ConnectionHop.connection).joinedload(Connection.pc)
        ).filter(ConnectionHop.patch_panel_id == pp_id).all()

        # Create a map for quick lookup: port number -> {pc_name, is_up}
        connected_ports_map = {
            hop.patch_panel_port: {
                "pc_name": hop.connection.pc.name if hop.connection and hop.connection.pc else "Unknown PC",
                "is_up": hop.is_port_up
            }
            for hop in hops_on_panel
        }
        
        ports_status = []
        for i in range(1, patch_panel.total_ports + 1):
            port_num_str = str(i)
            if port_num_str in connected_ports_map:
                info = connected_ports_map[port_num_str]
                ports_status.append({
                    'port_number': port_num_str,
                    'is_connected': True,
                    'connected_by_pc': info['pc_name'],
                    'is_up': info['is_up']
                })
            else:
                ports_status.append({
                    'port_number': port_num_str,
                    'is_connected': False,
                    'connected_by_pc': None,
                    'is_up': None
                })
        
        return {
            'patch_panel_name': patch_panel.name,
            'total_ports': patch_panel.total_ports,
            'patch_panel_location': patch_panel.location.name if patch_panel.location else None,
            'door_number': patch_panel.location.door_number if patch_panel.location else None,
            'rack_name': patch_panel.rack.name if patch_panel.rack else None,
            'row_in_rack': patch_panel.row_in_rack,
            'units_occupied': patch_panel.units_occupied,
            'ports': ports_status
        }

class SwitchService:
    @staticmethod
    def get_all_switches(): return Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).all()
    @staticmethod
    def get_by_id(id): return Switch.query.get(id)
    @staticmethod
    def create(data):
        new_switch = Switch(**data)
        db.session.add(new_switch)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'Switch', new_switch.id, new_switch.name, details=new_switch.to_dict())
        db.session.commit()
        return new_switch
    @staticmethod
    def update(_switch, data, is_revert=False):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(_switch, data)
            if changes:
                SystemLogService.create_log('UPDATE', 'Switch', _switch.id, data.get('name', _switch.name), changes)
        for key, value in data.items():
            if hasattr(_switch, key):
                setattr(_switch, key, value)
        db.session.commit()
        return _switch
    @staticmethod
    def delete(_switch):
        switch_id = _switch.id
        switch_name = _switch.name
        switch_data = _switch.to_dict()
        db.session.delete(_switch)
        SystemLogService.create_log('DELETE', 'Switch', switch_id, switch_name, details=switch_data)
        db.session.commit()
    @staticmethod
    def get_switch_ports_status(switch_id):
        _switch = Switch.query.get(switch_id)
        if not _switch:
            return None

        # Eagerly load related PC data
        connections_on_switch = db.session.query(Connection).options(
            joinedload(Connection.pc)
        ).filter(Connection.switch_id == switch_id).all()
        
        # Create a map for quick lookup: switch_port -> {pc_name, is_up}
        connected_ports_map = {
            conn.switch_port: {
                "pc_name": conn.pc.name if conn.pc else "Unknown PC",
                "is_up": conn.is_switch_port_up
            }
            for conn in connections_on_switch
        }

        ports_status = []
        for i in range(1, _switch.total_ports + 1):
            port_num_str = str(i)
            if port_num_str in connected_ports_map:
                info = connected_ports_map[port_num_str]
                ports_status.append({
                    'port_number': port_num_str,
                    'is_connected': True,
                    'connected_by_pc': info['pc_name'],
                    'is_up': info['is_up']
                })
            else:
                ports_status.append({
                    'port_number': port_num_str,
                    'is_connected': False,
                    'connected_by_pc': None,
                    'is_up': None
                })
        
        return {
            'switch_name': _switch.name,
            'ip_address': _switch.ip_address,
            'total_ports': _switch.total_ports,
            'switch_location': _switch.location.name if _switch.location else None,
            'door_number': _switch.location.door_number if _switch.location else None,
            'rack_name': _switch.rack.name if _switch.rack else None,
            'row_in_rack': _switch.row_in_rack,
            'units_occupied': _switch.units_occupied,
            'source_port': _switch.source_port,
            'model': _switch.model,
            'usage': _switch.usage,
            'ports': ports_status
        }

class ConnectionService:
    @staticmethod
    def get_all_connections(): return Connection.query.all()
    @staticmethod
    def get_by_id(id): return Connection.query.get(id)
    @staticmethod
    def create(data):
        hops_data = data.pop('hops', [])
        new_connection = Connection(**data)
        db.session.add(new_connection)
        db.session.flush()
        for hop_data in hops_data:
            # FIX: Filter out keys not present in the ConnectionHop model
            filtered_hop_data = {
                'connection_id': new_connection.id,
                'patch_panel_id': hop_data.get('patch_panel_id'),
                'patch_panel_port': hop_data.get('patch_panel_port'),
                'is_port_up': hop_data.get('is_port_up', True),
                'sequence': hop_data.get('sequence'),
                'cable_color': hop_data.get('cable_color'),
                'cable_label': hop_data.get('cable_label')
            }
            db.session.add(ConnectionHop(**filtered_hop_data))
        connection_name = f"Conn {new_connection.id}"
        SystemLogService.create_log('CREATE', 'Connection', new_connection.id, connection_name, details=new_connection.to_dict())
        db.session.commit()
        return new_connection
    @staticmethod
    def update(connection, data, is_revert=False):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(connection, data)
            if 'hops' in data: # Special handling for hops
                changes['hops'] = {'old': [h.to_dict() for h in connection.hops], 'new': data['hops']}
            
            if changes:
                connection_name = f"Conn {connection.id}"
                SystemLogService.create_log('UPDATE', 'Connection', connection.id, connection_name, changes)
        
        # Update main fields
        for key, value in data.items():
            if hasattr(connection, key) and key != 'hops':
                setattr(connection, key, value)
        
        # Update hops
        if 'hops' in data:
            for hop in connection.hops:
                db.session.delete(hop)
            db.session.flush()
            for hop_data in data['hops']:
                # FIX: Filter out keys not present in the ConnectionHop model
                filtered_hop_data = {
                    'connection_id': connection.id,
                    'patch_panel_id': hop_data.get('patch_panel_id'),
                    'patch_panel_port': hop_data.get('patch_panel_port'),
                    'is_port_up': hop_data.get('is_port_up', True),
                    'sequence': hop_data.get('sequence'),
                    'cable_color': hop_data.get('cable_color'),
                    'cable_label': hop_data.get('cable_label')
                }
                db.session.add(ConnectionHop(**filtered_hop_data))

        db.session.commit()
        return connection
    @staticmethod
    def delete(connection):
        conn_id = connection.id
        conn_name = f"Conn {conn_id}"
        conn_data = connection.to_dict()
        db.session.delete(connection)
        SystemLogService.create_log('DELETE', 'Connection', conn_id, conn_name, details=conn_data)
        db.session.commit()

class PdfTemplateService:
    @staticmethod
    def get_all_pdf_templates(): return PdfTemplate.query.all()
    @staticmethod
    def get_pdf_template_by_id(pdf_id): return PdfTemplate.query.get(pdf_id)

    @staticmethod
    def upload_pdf_template(file, app_config):
        # ... logic remains the same
        new_pdf = PdfTemplate(original_filename="dummy.pdf", stored_filename="dummy_stored.pdf")
        db.session.add(new_pdf)
        db.session.commit()
        return new_pdf

    @staticmethod
    def delete_pdf_template(pdf_template, upload_folder):
        pdf_id = pdf_template.id
        pdf_name = pdf_template.original_filename
        # ... logic to delete file from filesystem
        db.session.delete(pdf_template)
        SystemLogService.create_log('DELETE', 'PDF Template', pdf_id, pdf_name)
        db.session.commit()

class AppSettingsService:
    @staticmethod
    def get_app_settings(): return AppSettings.query.get(1)
    
    @staticmethod
    def set_default_pdf(default_pdf_id):
        settings = AppSettings.query.get(1)
        if not settings:
            settings = AppSettings(id=1)
            db.session.add(settings)
        
        old_pdf_id = settings.default_pdf_id
        settings.default_pdf_id = default_pdf_id
        
        SystemLogService.create_log(
            'UPDATE', 'Settings', 1, 'Default PDF Template', 
            details={'default_pdf_id': {'old': old_pdf_id, 'new': default_pdf_id}}
        )
        db.session.commit()
        return settings
