# backend/services.py
# This file contains the business logic and database interaction functions.
# UPDATED: Implemented the file-saving logic for PDF template uploads and deletions.

import os
import uuid
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from .extensions import db
from .models import Location, Rack, PC, PatchPanel, Switch, Connection, ConnectionHop, PdfTemplate, AppSettings, SystemLog, StockItem
from .utils import allowed_file, save_uploaded_file, validate_rack_unit_occupancy, check_rack_unit_decrease_conflict

# --- StockItemService ---
class StockItemService:
    @staticmethod
    def get_all_stock_items():
        return StockItem.query.options(joinedload(StockItem.assigned_to_pc)).all()

    @staticmethod
    def get_by_id(id):
        return StockItem.query.get(id)
    
    @staticmethod
    def _prepare_data(data):
        if 'purchase_date' in data and data['purchase_date']:
            try:
                data['purchase_date'] = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                data['purchase_date'] = None
        else:
            data['purchase_date'] = None
        
        if 'assigned_to_pc_id' in data:
            if data['assigned_to_pc_id'] == '' or data['assigned_to_pc_id'] is None:
                data['assigned_to_pc_id'] = None
            else:
                try:
                    data['assigned_to_pc_id'] = int(data['assigned_to_pc_id'])
                except (ValueError, TypeError):
                    data['assigned_to_pc_id'] = None

        if 'quantity' in data:
            try:
                data['quantity'] = int(data['quantity'])
            except (ValueError, TypeError):
                data['quantity'] = 1

        return data

    @staticmethod
    def create(data, action_by='system'):
        prepared_data = StockItemService._prepare_data(data)
        new_item = StockItem(**prepared_data)
        db.session.add(new_item)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'Stock Item', new_item.id, new_item.name, details=new_item.to_dict(), action_by=action_by)
        db.session.commit()
        return new_item

    @staticmethod
    def update(item, data, is_revert=False, action_by='system'):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(item, data)
            if changes:
                SystemLogService.create_log('UPDATE', 'Stock Item', item.id, data.get('name', item.name), changes, action_by=action_by)
        
        prepared_data = StockItemService._prepare_data(data)
            
        for key, value in prepared_data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        db.session.commit()
        return item

    @staticmethod
    def delete(item, action_by='system'):
        item_data = item.to_dict()
        SystemLogService.create_log('DELETE', 'Stock Item', item.id, item.name, details=item_data, action_by=action_by)
        db.session.delete(item)
        db.session.commit()

# --- System Logging Service ---
class SystemLogService:
    @staticmethod
    def _get_changed_fields(model_instance, new_data):
        changes = {}
        for key, value in new_data.items():
            current_value = getattr(model_instance, key, None)
            if isinstance(current_value, datetime.date):
                current_value = current_value.isoformat()
            
            normalized_current = "" if current_value is None else str(current_value)
            normalized_new = "" if value is None else str(value)

            if normalized_current != normalized_new:
                changes[key] = {'old': normalized_current, 'new': normalized_new}
        return changes

    @staticmethod
    def create_log(action_type, entity_type, entity_id=None, entity_name=None, details=None, action_by='system'):
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

    @staticmethod
    def get_all_logs(page=1, per_page=20, entity_type=None, action_type=None):
        query = SystemLog.query
        if entity_type:
            query = query.filter(SystemLog.entity_type == entity_type)
        if action_type:
            query = query.filter(SystemLog.action_type == action_type)
        query = query.order_by(SystemLog.timestamp.desc())
        return query.paginate(page=page, per_page=per_page, error_out=False)

    @staticmethod
    def revert_log_action(log_id, action_by='system'):
        log_to_revert = SystemLog.query.get(log_id)
        if not log_to_revert:
            raise ValueError("Log entry not found.")
        if log_to_revert.is_reverted:
            raise ValueError("This action has already been reverted.")

        service_map = {
            'Location': LocationService, 
            'Rack': RackService, 
            'PC': PCService, 
            'Patch Panel': PatchPanelService, 
            'Switch': SwitchService, 
            'Connection': ConnectionService,
            'Stock Item': StockItemService
        }
        service = service_map.get(log_to_revert.entity_type)
        if not service:
            raise ValueError(f"Revert action for entity type '{log_to_revert.entity_type}' is not supported.")

        if log_to_revert.action_type == 'CREATE':
            entity = service.get_by_id(log_to_revert.entity_id)
            if entity: service.delete(entity, action_by=action_by)
            else: raise ValueError(f"{log_to_revert.entity_type} with ID {log_to_revert.entity_id} not found for deletion.")
        elif log_to_revert.action_type == 'DELETE':
            if not log_to_revert.details: raise ValueError("Cannot revert DELETE action: No data stored in log.")
            service.create(log_to_revert.details, action_by=action_by)
        elif log_to_revert.action_type == 'UPDATE':
            entity = service.get_by_id(log_to_revert.entity_id)
            if not entity: raise ValueError(f"{log_to_revert.entity_type} with ID {log_to_revert.entity_id} not found for update.")
            old_values = {key: value['old'] for key, value in log_to_revert.details.items()}
            for key, value in old_values.items():
                if hasattr(entity, key):
                    column_type = type(getattr(entity, key, None))
                    if column_type is bool: old_values[key] = value.lower() == 'true'
                    elif column_type is int:
                        try: old_values[key] = int(value) if value and value != 'None' else None
                        except (ValueError, TypeError): old_values[key] = None
            service.update(entity, old_values, is_revert=True, action_by=action_by)
        else:
            raise ValueError(f"Cannot revert action of type '{log_to_revert.action_type}'.")

        log_to_revert.is_reverted = True
        SystemLogService.create_log(action_type='REVERT', entity_type=log_to_revert.entity_type, entity_id=log_to_revert.entity_id, entity_name=log_to_revert.entity_name, details={'reverted_log_id': log_id}, action_by=action_by)
        db.session.commit()
        return f"Successfully reverted action for {log_to_revert.entity_type}: {log_to_revert.entity_name}"

class LocationService:
    @staticmethod
    def get_all_locations(): return Location.query.all()
    @staticmethod
    def get_by_id(id): return Location.query.get(id)
    @staticmethod
    def create(data, action_by='system'):
        new_location = Location(**data)
        db.session.add(new_location)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'Location', new_location.id, new_location.name, details=new_location.to_dict(), action_by=action_by)
        db.session.commit()
        return new_location
    @staticmethod
    def update(location, data, is_revert=False, action_by='system'):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(location, data)
            if changes: SystemLogService.create_log('UPDATE', 'Location', location.id, data.get('name', location.name), changes, action_by=action_by)
        for key, value in data.items():
            if hasattr(location, key): setattr(location, key, value)
        db.session.commit()
        return location
    @staticmethod
    def delete(location, action_by='system'):
        location_data = location.to_dict()
        SystemLogService.create_log('DELETE', 'Location', location.id, location.name, details=location_data, action_by=action_by)
        db.session.delete(location)
        db.session.commit()

class RackService:
    @staticmethod
    def get_all_racks(): return Rack.query.options(joinedload(Rack.location)).all()
    @staticmethod
    def get_by_id(id): return Rack.query.get(id)
    @staticmethod
    def create(data, action_by='system'):
        new_rack = Rack(**data)
        db.session.add(new_rack)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'Rack', new_rack.id, new_rack.name, details=new_rack.to_dict(), action_by=action_by)
        db.session.commit()
        return new_rack
    @staticmethod
    def update(rack, data, is_revert=False, action_by='system'):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(rack, data)
            if changes: SystemLogService.create_log('UPDATE', 'Rack', rack.id, data.get('name', rack.name), changes, action_by=action_by)
        for key, value in data.items():
            if hasattr(rack, key): setattr(rack, key, value)
        db.session.commit()
        return rack
    @staticmethod
    def delete(rack, action_by='system'):
        rack_data = rack.to_dict()
        SystemLogService.create_log('DELETE', 'Rack', rack.id, rack.name, details=rack_data, action_by=action_by)
        db.session.delete(rack)
        db.session.commit()

class PCService:
    @staticmethod
    def get_all_pcs(): return PC.query.options(joinedload(PC.rack)).all()
    @staticmethod
    def get_by_id(id): return PC.query.get(id)
    @staticmethod
    def create(data, action_by='system'):
        new_pc = PC(**data)
        db.session.add(new_pc)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'PC', new_pc.id, new_pc.name, details=new_pc.to_dict(), action_by=action_by)
        db.session.commit()
        return new_pc
    @staticmethod
    def update(pc, data, is_revert=False, action_by='system'):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(pc, data)
            if changes: SystemLogService.create_log('UPDATE', 'PC', pc.id, data.get('name', pc.name), changes, action_by=action_by)
        for key, value in data.items():
            if hasattr(pc, key): setattr(pc, key, value)
        db.session.commit()
        return pc
    @staticmethod
    def delete(pc, action_by='system'):
        pc_data = pc.to_dict()
        SystemLogService.create_log('DELETE', 'PC', pc.id, pc.name, details=pc_data, action_by=action_by)
        db.session.delete(pc)
        db.session.commit()
    @staticmethod
    def get_available_pcs():
        all_pcs = PC.query.all()
        all_connections = Connection.query.options(joinedload(Connection.pc)).all()
        connected_single_port_pc_ids = {conn.pc_id for conn in all_connections if conn.pc and not conn.pc.multi_port}
        return [pc for pc in all_pcs if pc.multi_port or pc.id not in connected_single_port_pc_ids]

class PatchPanelService:
    @staticmethod
    def get_all_patch_panels(): return PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).all()
    @staticmethod
    def get_by_id(id): return PatchPanel.query.get(id)
    @staticmethod
    def create(data, action_by='system'):
        new_pp = PatchPanel(**data)
        db.session.add(new_pp)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'Patch Panel', new_pp.id, new_pp.name, details=new_pp.to_dict(), action_by=action_by)
        db.session.commit()
        return new_pp
    @staticmethod
    def update(pp, data, is_revert=False, action_by='system'):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(pp, data)
            if changes: SystemLogService.create_log('UPDATE', 'Patch Panel', pp.id, data.get('name', pp.name), changes, action_by=action_by)
        for key, value in data.items():
            if hasattr(pp, key): setattr(pp, key, value)
        db.session.commit()
        return pp
    @staticmethod
    def delete(pp, action_by='system'):
        pp_data = pp.to_dict()
        SystemLogService.create_log('DELETE', 'Patch Panel', pp.id, pp.name, details=pp_data, action_by=action_by)
        db.session.delete(pp)
        db.session.commit()
    @staticmethod
    def get_patch_panel_ports_status(pp_id):
        patch_panel = PatchPanel.query.get(pp_id)
        if not patch_panel: return None
        hops_on_panel = db.session.query(ConnectionHop).options(joinedload(ConnectionHop.connection).joinedload(Connection.pc)).filter(ConnectionHop.patch_panel_id == pp_id).all()
        connected_ports_map = { hop.patch_panel_port: {"pc_name": hop.connection.pc.name if hop.connection and hop.connection.pc else "Unknown PC", "is_up": hop.is_port_up} for hop in hops_on_panel }
        ports_status = []
        for i in range(1, patch_panel.total_ports + 1):
            port_num_str = str(i)
            if port_num_str in connected_ports_map:
                info = connected_ports_map[port_num_str]
                ports_status.append({'port_number': port_num_str, 'is_connected': True, 'connected_by_pc': info['pc_name'], 'is_up': info['is_up']})
            else:
                ports_status.append({'port_number': port_num_str, 'is_connected': False, 'connected_by_pc': None, 'is_up': None})
        return {'patch_panel_name': patch_panel.name, 'total_ports': patch_panel.total_ports, 'patch_panel_location': patch_panel.location.name if patch_panel.location else None, 'door_number': patch_panel.location.door_number if patch_panel.location else None, 'rack_name': patch_panel.rack.name if patch_panel.rack else None, 'row_in_rack': patch_panel.row_in_rack, 'units_occupied': patch_panel.units_occupied, 'ports': ports_status}

class SwitchService:
    @staticmethod
    def get_all_switches(): return Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).all()
    @staticmethod
    def get_by_id(id): return Switch.query.get(id)
    @staticmethod
    def create(data, action_by='system'):
        new_switch = Switch(**data)
        db.session.add(new_switch)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'Switch', new_switch.id, new_switch.name, details=new_switch.to_dict(), action_by=action_by)
        db.session.commit()
        return new_switch
    @staticmethod
    def update(_switch, data, is_revert=False, action_by='system'):
        if not is_revert:
            changes = SystemLogService._get_changed_fields(_switch, data)
            if changes: SystemLogService.create_log('UPDATE', 'Switch', _switch.id, data.get('name', _switch.name), changes, action_by=action_by)
        for key, value in data.items():
            if hasattr(_switch, key): setattr(_switch, key, value)
        db.session.commit()
        return _switch
    @staticmethod
    def delete(_switch, action_by='system'):
        switch_data = _switch.to_dict()
        SystemLogService.create_log('DELETE', 'Switch', _switch.id, _switch.name, details=switch_data, action_by=action_by)
        db.session.delete(_switch)
        db.session.commit()
    @staticmethod
    def get_switch_ports_status(switch_id):
        _switch = Switch.query.get(switch_id)
        if not _switch: return None
        connections_on_switch = db.session.query(Connection).options(joinedload(Connection.pc)).filter(Connection.switch_id == switch_id).all()
        connected_ports_map = {conn.switch_port: {"pc_name": conn.pc.name if conn.pc else "Unknown PC", "is_up": conn.is_switch_port_up} for conn in connections_on_switch}
        ports_status = []
        for i in range(1, _switch.total_ports + 1):
            port_num_str = str(i)
            if port_num_str in connected_ports_map:
                info = connected_ports_map[port_num_str]
                ports_status.append({'port_number': port_num_str, 'is_connected': True, 'connected_by_pc': info['pc_name'], 'is_up': info['is_up']})
            else:
                ports_status.append({'port_number': port_num_str, 'is_connected': False, 'connected_by_pc': None, 'is_up': None})
        return {'switch_name': _switch.name, 'ip_address': _switch.ip_address, 'total_ports': _switch.total_ports, 'switch_location': _switch.location.name if _switch.location else None, 'door_number': _switch.location.door_number if _switch.location else None, 'rack_name': _switch.rack.name if _switch.rack else None, 'row_in_rack': _switch.row_in_rack, 'units_occupied': _switch.units_occupied, 'source_port': _switch.source_port, 'model': _switch.model, 'usage': _switch.usage, 'ports': ports_status}

class ConnectionService:
    @staticmethod
    def get_all_connections(): return Connection.query.all()
    @staticmethod
    def get_by_id(id): return Connection.query.get(id)
    @staticmethod
    def create(data, action_by='system'):
        hops_data = data.pop('hops', [])
        new_connection = Connection(**data)
        db.session.add(new_connection)
        db.session.flush()
        for hop_data in hops_data:
            filtered_hop_data = {k: v for k, v in hop_data.items() if k in ConnectionHop.__table__.columns.keys()}
            filtered_hop_data['connection_id'] = new_connection.id
            db.session.add(ConnectionHop(**filtered_hop_data))
        connection_name = f"Conn {new_connection.id}"
        SystemLogService.create_log('CREATE', 'Connection', new_connection.id, connection_name, details=new_connection.to_dict(), action_by=action_by)
        db.session.commit()
        return new_connection
    @staticmethod
    def update(connection, data, is_revert=False, action_by='system'):
        if not is_revert:
            data_for_comparison = data.copy()
            hop_changes = {}

            if 'hops' in data:
                old_hops_simple = sorted([{'pp_id': h.patch_panel_id, 'port': h.patch_panel_port} for h in connection.hops], key=lambda x: (x.get('pp_id', 0) or 0))
                new_hops_simple = sorted([{'pp_id': int(h.get('patch_panel_id')) if h.get('patch_panel_id') else None, 'port': h.get('patch_panel_port')} for h in data.get('hops', [])], key=lambda x: (x.get('pp_id', 0) or 0))

                if old_hops_simple != new_hops_simple:
                    old_hops_str = ", ".join([f"{PatchPanel.query.get(h['pp_id']).name} (Port {h['port']})" for h in old_hops_simple if h['pp_id']])
                    new_hops_str = ", ".join([f"{PatchPanel.query.get(h['pp_id']).name} (Port {h['port']})" for h in new_hops_simple if h['pp_id']])
                    hop_changes = {'hops': {'old': old_hops_str or "None", 'new': new_hops_str or "None"}}
            
            if 'hops' in data_for_comparison:
                del data_for_comparison['hops']
            
            other_changes = SystemLogService._get_changed_fields(connection, data_for_comparison)
            all_changes = {**other_changes, **hop_changes}

            if all_changes:
                connection_name = f"Conn {connection.id}"
                SystemLogService.create_log('UPDATE', 'Connection', connection.id, connection_name, all_changes, action_by=action_by)

        for key, value in data.items():
            if hasattr(connection, key) and key != 'hops': setattr(connection, key, value)
        if 'hops' in data:
            for hop in connection.hops: db.session.delete(hop)
            db.session.flush()
            for hop_data in data['hops']:
                filtered_hop_data = {k: v for k, v in hop_data.items() if k in ConnectionHop.__table__.columns.keys()}
                filtered_hop_data['connection_id'] = connection.id
                db.session.add(ConnectionHop(**filtered_hop_data))
        db.session.commit()
        return connection
    @staticmethod
    def delete(connection, action_by='system'):
        conn_data = connection.to_dict()
        SystemLogService.create_log('DELETE', 'Connection', connection.id, f"Conn {connection.id}", details=conn_data, action_by=action_by)
        db.session.delete(connection)
        db.session.commit()

class PdfTemplateService:
    @staticmethod
    def get_all_pdf_templates(): return PdfTemplate.query.all()

    @staticmethod
    def get_by_id(id): return PdfTemplate.query.get(id)

    @staticmethod
    def upload_pdf_template(file, app_config, action_by='system'):
        if not allowed_file(file.filename, app_config['ALLOWED_EXTENSIONS']):
            raise ValueError("File type not allowed.")

        if PdfTemplate.query.count() >= app_config['MAX_PDF_FILES']:
            raise ValueError(f"Cannot upload more than {app_config['MAX_PDF_FILES']} PDF templates.")

        stored_filename = save_uploaded_file(file, app_config['UPLOAD_FOLDER'])
        
        new_pdf = PdfTemplate(original_filename=file.filename, stored_filename=stored_filename)
        db.session.add(new_pdf)
        db.session.flush()
        SystemLogService.create_log('CREATE', 'PDF Template', new_pdf.id, new_pdf.original_filename, action_by=action_by)
        db.session.commit()
        return new_pdf

    @staticmethod
    def delete_pdf_template(pdf_template, upload_folder, action_by='system'):
        try:
            filepath = os.path.join(upload_folder, pdf_template.stored_filename)
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            print(f"Error deleting PDF file {pdf_template.stored_filename}: {e}")

        SystemLogService.create_log('DELETE', 'PDF Template', pdf_template.id, pdf_template.original_filename, action_by=action_by)
        db.session.delete(pdf_template)
        db.session.commit()

class AppSettingsService:
    @staticmethod
    def get_app_settings(): return AppSettings.query.get(1)
    
    @staticmethod
    def set_default_pdf(default_pdf_id, action_by='system'):
        settings = AppSettings.query.get(1)
        if not settings:
            settings = AppSettings(id=1)
            db.session.add(settings)
        
        old_pdf_id = settings.default_pdf_id
        settings.default_pdf_id = default_pdf_id
        
        SystemLogService.create_log('UPDATE', 'Settings', 1, 'Default PDF Template', details={'default_pdf_id': {'old': old_pdf_id, 'new': default_pdf_id}}, action_by=action_by)
        db.session.commit()
        return settings
