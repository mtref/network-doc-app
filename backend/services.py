# backend/services.py
# This file contains the business logic and database interaction functions.

import os
import uuid
from sqlalchemy.orm import joinedload
from sqlalchemy import cast, Integer

from .extensions import db
from .models import Location, Rack, PC, PatchPanel, Switch, Connection, ConnectionHop, PdfTemplate, AppSettings
from .utils import validate_port_occupancy, validate_rack_unit_occupancy, check_rack_unit_decrease_conflict, allowed_file

# --- Global Constants (can be moved to a config.py if more complex) ---
MAX_HOPS = 5 # Maximum number of hops to export/import for connections

class LocationService:
    @staticmethod
    def get_all_locations():
        """Retrieves all locations from the database."""
        return Location.query.all()

    @staticmethod
    def get_location_by_id(location_id):
        """Retrieves a single location by its ID."""
        return Location.query.get(location_id)

    @staticmethod
    def create_location(data):
        """Creates a new location."""
        new_location = Location(
            name=data['name'],
            door_number=data.get('door_number'),
            description=data.get('description')
        )
        db.session.add(new_location)
        db.session.commit()
        return new_location

    @staticmethod
    def update_location(location, data):
        """Updates an existing location."""
        location.name = data.get('name', location.name)
        location.door_number = data.get('door_number', location.door_number)
        location.description = data.get('description', location.description)
        db.session.commit()
        return location

    @staticmethod
    def delete_location(location):
        """Deletes a location."""
        db.session.delete(location)
        db.session.commit()

class RackService:
    @staticmethod
    def get_all_racks():
        """Retrieves all racks, eager loading their associated locations."""
        return Rack.query.options(joinedload(Rack.location)).all()

    @staticmethod
    def get_rack_by_id(rack_id):
        """Retrieves a single rack by its ID, eager loading its associated location."""
        return Rack.query.options(joinedload(Rack.location)).get(rack_id)

    @staticmethod
    def create_rack(data):
        """Creates a new rack with validation."""
        total_units = data.get('total_units', 42)
        try:
            total_units = int(total_units)
            if not (1 <= total_units <= 50):
                raise ValueError('Total units must be an integer between 1 and 50.')
        except (ValueError, TypeError):
            raise ValueError('Total units must be a valid integer.')

        new_rack = Rack(
            name=data['name'],
            location_id=data['location_id'],
            description=data.get('description'),
            total_units=total_units,
            orientation=data.get('orientation', 'bottom-up')
        )
        db.session.add(new_rack)
        db.session.commit()
        db.session.refresh(new_rack)
        return new_rack

    @staticmethod
    def update_rack(rack, data):
        """Updates an existing rack with validation for unit changes."""
        if 'total_units' in data:
            new_total_units = data.get('total_units')
            try:
                new_total_units = int(new_total_units)
                if not (1 <= new_total_units <= 50):
                    raise ValueError('Total units must be an integer between 1 and 50.')
            except (ValueError, TypeError):
                raise ValueError('Total units must be a valid integer.')
            
            if new_total_units < rack.total_units:
                has_conflict, error_message = check_rack_unit_decrease_conflict(db.session, rack.id, new_total_units)
                if has_conflict:
                    raise ValueError(error_message)
            rack.total_units = new_total_units
        
        rack.name = data.get('name', rack.name)
        rack.location_id = data.get('location_id', rack.location_id)
        rack.description = data.get('description', rack.description)
        rack.orientation = data.get('orientation', rack.orientation)
        
        db.session.commit()
        db.session.refresh(rack)
        return rack

    @staticmethod
    def delete_rack(rack):
        """Deletes a rack."""
        db.session.delete(rack)
        db.session.commit()

class PCService:
    @staticmethod
    def get_all_pcs():
        """Retrieves all PCs, eager loading their associated racks."""
        return PC.query.options(joinedload(PC.rack)).all()

    @staticmethod
    def get_pc_by_id(pc_id):
        """Retrieves a single PC by its ID, eager loading its associated rack."""
        return PC.query.options(joinedload(PC.rack)).get(pc_id)

    @staticmethod
    def create_pc(data):
        """Creates a new PC with validation."""
        pc_type = data.get('type', 'Workstation')
        rack_id = data.get('rack_id')
        row_in_rack = data.get('row_in_rack')
        units_occupied = data.get('units_occupied', 1)

        if pc_type == 'Server' and rack_id and row_in_rack is not None:
            try:
                units_occupied = int(units_occupied)
                if units_occupied < 1:
                    raise ValueError('Units occupied must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Units occupied must be a valid integer.')

            try:
                row_in_rack = int(row_in_rack)
                if row_in_rack < 1:
                    raise ValueError('Row in rack must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Row in rack must be a valid integer.')

            is_occupied, conflicting_device = validate_rack_unit_occupancy(
                db.session,
                rack_id=rack_id,
                start_row_in_rack=row_in_rack,
                units_occupied=units_occupied,
                device_type='pc'
            )
            if is_occupied:
                raise ValueError(f"Rack unit(s) is already occupied by {conflicting_device}.")
        
        if pc_type != 'Server':
            rack_id = None
            row_in_rack = None
            units_occupied = 1

        new_pc = PC(
            name=data['name'],
            ip_address=data.get('ip_address'),
            username=data.get('username'),
            in_domain=data.get('in_domain', False),
            operating_system=data.get('operating_system'),
            model=data.get('model'),
            office=data.get('office'),
            description=data.get('description'),
            multi_port=data.get('multi_port', False),
            type=pc_type,
            usage=data.get('usage'),
            row_in_rack=row_in_rack,
            rack_id=rack_id,
            units_occupied=units_occupied
        )
        db.session.add(new_pc)
        db.session.commit()
        db.session.refresh(new_pc)
        return new_pc

    @staticmethod
    def update_pc(pc, data):
        """Updates an existing PC with validation."""
        pc_type = data.get('type', pc.type)
        rack_id = data.get('rack_id', pc.rack_id)
        row_in_rack = data.get('row_in_rack', pc.row_in_rack)
        units_occupied = data.get('units_occupied', pc.units_occupied)

        if pc_type == 'Server' and rack_id and row_in_rack is not None:
            try:
                units_occupied = int(units_occupied)
                if units_occupied < 1:
                    raise ValueError('Units occupied must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Units occupied must be a valid integer.')
            
            try:
                row_in_rack = int(row_in_rack)
                if row_in_rack < 1:
                    raise ValueError('Row in rack must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Row in rack must be a valid integer.')

            rack_changed = str(rack_id) != str(pc.rack_id)
            row_changed = str(row_in_rack) != str(pc.row_in_rack)
            units_changed = str(units_occupied) != str(pc.units_occupied)
            type_changed_to_server = pc.type != 'Server' and pc_type == 'Server'

            if rack_changed or row_changed or units_changed or type_changed_to_server:
                is_occupied, conflicting_device = validate_rack_unit_occupancy(
                    db.session,
                    rack_id=rack_id,
                    start_row_in_rack=row_in_rack,
                    units_occupied=units_occupied,
                    device_type='pc',
                    exclude_device_id=pc.id
                )
                if is_occupied:
                    raise ValueError(f"Rack unit(s) is already occupied by {conflicting_device}.")
        
        if pc_type != 'Server':
            rack_id = None
            row_in_rack = None
            units_occupied = 1

        pc.name = data.get('name', pc.name)
        pc.ip_address = data.get('ip_address', pc.ip_address)
        pc.username = data.get('username', pc.username)
        pc.in_domain = data.get('in_domain', pc.in_domain)
        pc.operating_system = data.get('operating_system', pc.operating_system)
        pc.model = data.get('model', pc.model)
        pc.office = data.get('office', pc.office)
        pc.description = data.get('description', pc.description)
        pc.multi_port = data.get('multi_port', pc.multi_port)
        pc.type = pc_type
        pc.usage = data.get('usage', pc.usage)
        pc.row_in_rack = row_in_rack
        pc.rack_id = rack_id
        pc.units_occupied = units_occupied

        db.session.commit()
        db.session.refresh(pc)
        return pc

    @staticmethod
    def delete_pc(pc):
        """Deletes a PC."""
        db.session.delete(pc)
        db.session.commit()

    @staticmethod
    def get_available_pcs():
        """
        Returns a list of PCs available for new connections.
        """
        all_pcs = PC.query.all()
        all_connections = Connection.query.options(joinedload(Connection.pc)).all()
        connected_single_port_pc_ids = {conn.pc_id for conn in all_connections if conn.pc and not conn.pc.multi_port}
        available_pcs = [pc for pc in all_pcs if pc.multi_port or pc.id not in connected_single_port_pc_ids]
        return available_pcs

class PatchPanelService:
    @staticmethod
    def get_all_patch_panels():
        """Retrieves all patch panels, eager loading their associated locations and racks."""
        return PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).all()

    @staticmethod
    def get_patch_panel_by_id(pp_id):
        """Retrieves a single patch panel by its ID, eager loading its associated location and rack."""
        return PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).get(pp_id)

    @staticmethod
    def create_patch_panel(data):
        """Creates a new patch panel with validation."""
        rack_id = data.get('rack_id')
        row_in_rack = data.get('row_in_rack')
        units_occupied = data.get('units_occupied', 1)

        if rack_id and row_in_rack is not None:
            try:
                units_occupied = int(units_occupied)
                if units_occupied < 1:
                    raise ValueError('Units occupied must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Units occupied must be a valid integer.')

            try:
                row_in_rack = int(row_in_rack)
                if row_in_rack < 1:
                    raise ValueError('Row in rack must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Row in rack must be a valid integer.')

            is_occupied, conflicting_device = validate_rack_unit_occupancy(
                db.session,
                rack_id=rack_id,
                start_row_in_rack=row_in_rack,
                units_occupied=units_occupied,
                device_type='patch_panel'
            )
            if is_occupied:
                raise ValueError(f"Rack unit(s) is already occupied by {conflicting_device}.")

        total_ports = int(data.get('total_ports', 1)) if str(data.get('total_ports', 1)).isdigit() else 1
        new_pp = PatchPanel(
            name=data['name'],
            location_id=data.get('location_id'),
            row_in_rack=row_in_rack,
            rack_id=rack_id,
            units_occupied=units_occupied,
            total_ports=total_ports,
            description=data.get('description')
        )
        db.session.add(new_pp)
        db.session.commit()
        db.session.refresh(new_pp)
        return new_pp

    @staticmethod
    def update_patch_panel(pp, data):
        """Updates an existing patch panel with validation."""
        rack_id = data.get('rack_id', pp.rack_id)
        row_in_rack = data.get('row_in_rack', pp.row_in_rack)
        units_occupied = data.get('units_occupied', pp.units_occupied)

        if rack_id and row_in_rack is not None:
            try:
                units_occupied = int(units_occupied)
                if units_occupied < 1:
                    raise ValueError('Units occupied must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Units occupied must be a valid integer.')
            
            try:
                row_in_rack = int(row_in_rack)
                if row_in_rack < 1:
                    raise ValueError('Row in rack must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Row in rack must be a valid integer.')

            rack_changed = str(rack_id) != str(pp.rack_id)
            row_changed = str(row_in_rack) != str(pp.row_in_rack)
            units_changed = str(units_occupied) != str(pp.units_occupied)

            if rack_changed or row_changed or units_changed:
                is_occupied, conflicting_device = validate_rack_unit_occupancy(
                    db.session,
                    rack_id=rack_id,
                    start_row_in_rack=row_in_rack,
                    units_occupied=units_occupied,
                    device_type='patch_panel',
                    exclude_device_id=pp.id
                )
                if is_occupied:
                    raise ValueError(f"Rack unit(s) is already occupied by {conflicting_device}.")

        pp.name = data.get('name', pp.name)
        pp.location_id = data.get('location_id', pp.location_id)
        pp.row_in_rack = row_in_rack
        pp.rack_id = rack_id
        pp.units_occupied = units_occupied
        pp.total_ports = int(data.get('total_ports', pp.total_ports)) if str(data.get('total_ports', pp.total_ports)).isdigit() else pp.total_ports
        pp.description = data.get('description', pp.description)
        db.session.commit()
        db.session.refresh(pp)
        return pp

    @staticmethod
    def delete_patch_panel(pp):
        """Deletes a patch panel."""
        db.session.delete(pp)
        db.session.commit()

    @staticmethod
    def get_patch_panel_ports_status(pp_id):
        """Retrieves the status of all ports for a given patch panel."""
        patch_panel = PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).get(pp_id)
        if not patch_panel:
            return None

        try:
            total_ports_int = int(patch_panel.total_ports)
        except (ValueError, TypeError):
            total_ports_int = 0

        all_ports = list(range(1, total_ports_int + 1))
        
        used_hops = ConnectionHop.query.options(joinedload(ConnectionHop.connection).joinedload(Connection.pc)).filter(
            ConnectionHop.patch_panel_id == pp_id
        ).all()

        connected_ports_info = {}
        for hop in used_hops:
            try:
                port_num = int(hop.patch_panel_port)
                if 1 <= port_num <= total_ports_int:
                    connected_ports_info[port_num] = {
                        'connected_by_pc': hop.connection.pc.name if hop.connection.pc else "Unknown PC",
                        'connection_id': hop.connection_id,
                        'is_up': hop.is_port_up
                    }
            except (ValueError, TypeError):
                continue
        
        port_status = []
        for i in all_ports:
            status = connected_ports_info.get(i)
            port_status.append({
                'port_number': str(i),
                'is_connected': status is not None,
                'connected_by_pc': status['connected_by_pc'] if status else None,
                'connection_id': status['connection_id'] if status else None,
                'is_up': status['is_up'] if status else False
            })
        
        return {
            'patch_panel_id': pp_id,
            'patch_panel_name': patch_panel.name,
            'patch_panel_location': patch_panel.location.name if patch_panel.location else None,
            'row_in_rack': patch_panel.row_in_rack,
            'units_occupied': patch_panel.units_occupied,
            'rack_name': patch_panel.rack.name if patch_panel.rack else None,
            'description': patch_panel.description,
            'total_ports': patch_panel.total_ports,
            'location': patch_panel.location.to_dict() if patch_panel.location else None,
            'rack': patch_panel.rack.to_dict() if patch_panel.rack else None,
            'ports': port_status
        }

class SwitchService:
    @staticmethod
    def get_all_switches():
        """Retrieves all switches, eager loading their associated locations and racks."""
        return Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).all()

    @staticmethod
    def get_switch_by_id(switch_id):
        """Retrieves a single switch by its ID, eager loading its associated location and rack."""
        return Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).get(switch_id)

    @staticmethod
    def create_switch(data):
        """Creates a new switch with validation."""
        rack_id = data.get('rack_id')
        row_in_rack = data.get('row_in_rack')
        units_occupied = data.get('units_occupied', 1)

        if rack_id and row_in_rack is not None:
            try:
                units_occupied = int(units_occupied)
                if units_occupied < 1:
                    raise ValueError('Units occupied must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Units occupied must be a valid integer.')
            
            try:
                row_in_rack = int(row_in_rack)
                if row_in_rack < 1:
                    raise ValueError('Row in rack must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Row in rack must be a valid integer.')

            is_occupied, conflicting_device = validate_rack_unit_occupancy(
                db.session,
                rack_id=rack_id,
                start_row_in_rack=row_in_rack,
                units_occupied=units_occupied,
                device_type='switch'
            )
            if is_occupied:
                raise ValueError(f"Rack unit(s) is already occupied by {conflicting_device}.")

        total_ports = int(data.get('total_ports', 1)) if str(data.get('total_ports', 1)).isdigit() else 1
        new_switch = Switch(
            name=data['name'],
            ip_address=data.get('ip_address'),
            location_id=data.get('location_id'),
            row_in_rack=row_in_rack,
            rack_id=rack_id,
            units_occupied=units_occupied,
            total_ports=total_ports,
            source_port=data.get('source_port'),
            model=data.get('model'),
            description=data.get('description'),
            usage=data.get('usage')
        )
        db.session.add(new_switch)
        db.session.commit()
        db.session.refresh(new_switch)
        return new_switch

    @staticmethod
    def update_switch(_switch, data):
        """Updates an existing switch with validation."""
        rack_id = data.get('rack_id', _switch.rack_id)
        row_in_rack = data.get('row_in_rack', _switch.row_in_rack)
        units_occupied = data.get('units_occupied', _switch.units_occupied)

        if rack_id and row_in_rack is not None:
            try:
                units_occupied = int(units_occupied)
                if units_occupied < 1:
                    raise ValueError('Units occupied must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Units occupied must be a valid integer.')
            
            try:
                row_in_rack = int(row_in_rack)
                if row_in_rack < 1:
                    raise ValueError('Row in rack must be at least 1.')
            except (ValueError, TypeError):
                raise ValueError('Row in rack must be a valid integer.')

            rack_changed = str(rack_id) != str(_switch.rack_id)
            row_changed = str(row_in_rack) != str(_switch.row_in_rack)
            units_changed = str(units_occupied) != str(_switch.units_occupied)

            if rack_changed or row_changed or units_changed:
                is_occupied, conflicting_device = validate_rack_unit_occupancy(
                    db.session,
                    rack_id=rack_id,
                    start_row_in_rack=row_in_rack,
                    units_occupied=units_occupied,
                    device_type='switch',
                    exclude_device_id=_switch.id
                )
                if is_occupied:
                    raise ValueError(f"Rack unit(s) is already occupied by {conflicting_device}.")

        _switch.name = data.get('name', _switch.name)
        _switch.ip_address = data.get('ip_address', _switch.ip_address)
        _switch.location_id = data.get('location_id', _switch.location_id)
        _switch.row_in_rack = row_in_rack
        _switch.rack_id = rack_id
        _switch.units_occupied = units_occupied
        _switch.total_ports = int(data.get('total_ports', _switch.total_ports)) if str(data.get('total_ports', _switch.total_ports)).isdigit() else _switch.total_ports
        _switch.source_port = data.get('source_port', _switch.source_port)
        _switch.model = data.get('model', _switch.model)
        _switch.description = data.get('description', _switch.description)
        _switch.usage = data.get('usage', _switch.usage)
        db.session.commit()
        db.session.refresh(_switch)
        return _switch

    @staticmethod
    def delete_switch(_switch):
        """Deletes a switch."""
        db.session.delete(_switch)
        db.session.commit()

    @staticmethod
    def get_switch_ports_status(switch_id):
        """Retrieves the status of all ports for a given switch."""
        _switch = Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).get(switch_id)
        if not _switch:
            return None
        
        try:
            total_ports_int = int(_switch.total_ports)
        except (ValueError, TypeError):
            total_ports_int = 0

        all_ports = list(range(1, total_ports_int + 1))

        used_connections = Connection.query.options(joinedload(Connection.pc)).filter(
            Connection.switch_id == switch_id
        ).all()

        connected_ports_info = {}
        for conn in used_connections:
            try:
                port_num = int(conn.switch_port)
                if 1 <= port_num <= total_ports_int:
                    connected_ports_info[port_num] = {
                        'connected_by_pc': conn.pc.name if conn.pc else "Unknown PC",
                        'connection_id': conn.id,
                        'is_up': conn.is_switch_port_up
                    }
            except (ValueError, TypeError):
                continue
        
        port_status = []
        for i in all_ports:
            status = connected_ports_info.get(i)
            port_status.append({
                'port_number': str(i),
                'is_connected': status is not None,
                'connected_by_pc': status['connected_by_pc'] if status else None,
                'connection_id': status['connection_id'] if status else None,
                'is_up': status['is_up'] if status else False
            })
        
        return {
            'switch_id': switch_id,
            'switch_name': _switch.name,
            'switch_location': _switch.location.name if _switch.location else None,
            'ip_address': _switch.ip_address,
            'row_in_rack': _switch.row_in_rack,
            'units_occupied': _switch.units_occupied,
            'rack_name': _switch.rack.name if _switch.rack else None,
            'source_port': _switch.source_port,
            'model': _switch.model,
            'description': _switch.description,
            'total_ports': _switch.total_ports,
            'location': _switch.location.to_dict() if _switch.location else None,
            'rack': _switch.rack.to_dict() if _switch.rack else None,
            'ports': port_status
        }

class ConnectionService:
    @staticmethod
    def get_all_connections():
        """Retrieves all connections with all related data eagerly loaded."""
        return Connection.query.options(
            joinedload(Connection.pc).joinedload(PC.rack),
            joinedload(Connection.switch).joinedload(Switch.location),
            joinedload(Connection.switch).joinedload(Switch.rack),
            joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.location),
            joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.rack)
        ).all()

    @staticmethod
    def get_connection_by_id(conn_id):
        """Retrieves a single connection by its ID with all related data eagerly loaded."""
        return Connection.query.options(
            joinedload(Connection.pc).joinedload(PC.rack),
            joinedload(Connection.switch).joinedload(Switch.location),
            joinedload(Connection.switch).joinedload(Switch.rack),
            joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.location),
            joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.rack)
        ).get(conn_id)

    @staticmethod
    def create_connection(data):
        """Creates a new connection with all necessary validations and hop creation."""
        pc = PC.query.get(data['pc_id'])
        if pc and not pc.multi_port:
            existing_connection_for_pc = Connection.query.filter_by(pc_id=pc.id).first()
            if existing_connection_for_pc:
                raise ValueError(f"PC '{pc.name}' is a single-port device and is already connected. Cannot create new connection.")

        is_occupied, conflicting_pc = validate_port_occupancy(
            db.session,
            target_id=data['switch_id'],
            port_number=data['switch_port'],
            entity_type='switch'
        )
        if is_occupied:
            raise ValueError(f'Switch port {data["switch_port"]} is already in use by PC: {conflicting_pc}')

        new_connection = Connection(
            pc_id=data['pc_id'],
            switch_id=data['switch_id'],
            switch_port=data['switch_port'],
            is_switch_port_up=data['is_switch_port_up'],
            cable_color=data.get('cable_color'),
            cable_label=data.get('cable_label'),
            wall_point_label=data.get('wall_point_label'),
            # ADDED: Handle new wall point cable fields on creation
            wall_point_cable_color=data.get('wall_point_cable_color'),
            wall_point_cable_label=data.get('wall_point_cable_label')
        )
        db.session.add(new_connection)
        db.session.flush()

        for idx, hop_data in enumerate(data.get('hops', [])):
            if not all(f in hop_data for f in ['patch_panel_id', 'patch_panel_port', 'is_port_up']):
                raise ValueError(f'Missing fields for hop {idx}')

            is_occupied, conflicting_pc = validate_port_occupancy(
                db.session,
                target_id=hop_data['patch_panel_id'],
                port_number=hop_data['patch_panel_port'],
                entity_type='patch_panel',
                exclude_connection_id=new_connection.id
            )
            if is_occupied:
                raise ValueError(f'Patch Panel port {hop_data["patch_panel_port"]} on Patch Panel ID {hop_data["patch_panel_id"]} is already in use by PC: {conflicting_pc}')

            new_hop = ConnectionHop(
                connection_id=new_connection.id,
                patch_panel_id=hop_data['patch_panel_id'],
                patch_panel_port=hop_data['patch_panel_port'],
                is_port_up=hop_data['is_port_up'],
                sequence=idx,
                cable_color=hop_data.get('cable_color'),
                cable_label=hop_data.get('cable_label')
            )
            db.session.add(new_hop)
        
        db.session.commit()
        db.session.refresh(new_connection)
        return new_connection

    @staticmethod
    def update_connection(connection, data):
        """Updates an existing connection with all necessary validations and hop updates."""
        new_pc_id = data.get('pc_id', connection.pc_id)
        if new_pc_id != connection.pc_id:
            new_pc = PC.query.get(new_pc_id)
            if new_pc and not new_pc.multi_port:
                existing_connection_for_new_pc = Connection.query.filter(
                    Connection.pc_id == new_pc.id,
                    Connection.id != connection.id
                ).first()
                if existing_connection_for_new_pc:
                    raise ValueError(f"PC '{new_pc.name}' is a single-port device and is already connected in another connection. Cannot update.")

        if 'switch_id' in data and 'switch_port' in data:
            is_occupied, conflicting_pc = validate_port_occupancy(
                db.session,
                target_id=data['switch_id'],
                port_number=data['switch_port'],
                entity_type='switch',
                exclude_connection_id=connection.id
            )
            if is_occupied:
                raise ValueError(f'Switch port {data["switch_port"]} is already in use by PC: {conflicting_pc}')

        connection.pc_id = data.get('pc_id', connection.pc_id)
        connection.switch_id = data.get('switch_id', connection.switch_id)
        connection.switch_port = data.get('switch_port', connection.switch_port)
        connection.is_switch_port_up = data.get('is_switch_port_up', connection.is_switch_port_up)
        connection.cable_color = data.get('cable_color', connection.cable_color)
        connection.cable_label = data.get('cable_label', connection.cable_label)
        connection.wall_point_label = data.get('wall_point_label', connection.wall_point_label)
        # ADDED: Handle new wall point cable fields on update
        connection.wall_point_cable_color = data.get('wall_point_cable_color', connection.wall_point_cable_color)
        connection.wall_point_cable_label = data.get('wall_point_cable_label', connection.wall_point_cable_label)

        if 'hops' in data:
            for hop in connection.hops:
                db.session.delete(hop)
            db.session.flush()

            for idx, hop_data in enumerate(data.get('hops', [])):
                if not all(f in hop_data for f in ['patch_panel_id', 'patch_panel_port', 'is_port_up']):
                    raise ValueError(f'Missing fields for hop {idx}')

                is_occupied, conflicting_pc = validate_port_occupancy(
                    db.session,
                    target_id=hop_data['patch_panel_id'],
                    port_number=hop_data['patch_panel_port'],
                    entity_type='patch_panel',
                    exclude_connection_id=connection.id
                )
                if is_occupied:
                    raise ValueError(f'Patch Panel port {hop_data["patch_panel_port"]} on Patch Panel ID {hop_data["patch_panel_id"]} is already in use by PC: {conflicting_pc}')

                new_hop = ConnectionHop(
                    connection_id=connection.id,
                    patch_panel_id=hop_data['patch_panel_id'],
                    patch_panel_port=hop_data['patch_panel_port'],
                    is_port_up=hop_data['is_port_up'],
                    sequence=idx,
                    cable_color=hop_data.get('cable_color'),
                    cable_label=hop_data.get('cable_label')
                )
                db.session.add(new_hop)
        
        db.session.commit()
        db.session.refresh(connection)
        return connection

    @staticmethod
    def delete_connection(connection):
        """Deletes a connection."""
        db.session.delete(connection)
        db.session.commit()

class PdfTemplateService:
    @staticmethod
    def get_all_pdf_templates():
        """Retrieves all PDF templates."""
        return PdfTemplate.query.all()

    @staticmethod
    def get_pdf_template_by_id(pdf_id):
        """Retrieves a single PDF template by its ID."""
        return PdfTemplate.query.get(pdf_id)

    @staticmethod
    def upload_pdf_template(file, app_config):
        """Uploads a new PDF template, with limits and unique naming."""
        if PdfTemplate.query.count() >= app_config['MAX_PDF_FILES']:
            raise ValueError(f'Maximum of {app_config["MAX_PDF_FILES"]} PDF templates allowed.')

        if not allowed_file(file.filename, app_config['ALLOWED_EXTENSIONS']):
            raise ValueError('File type not allowed.')
        
        original_filename = file.filename
        unique_filename = str(uuid.uuid4()) + '.' + original_filename.rsplit('.', 1)[1].lower()
        filepath = os.path.join(app_config['UPLOAD_FOLDER'], unique_filename)
        
        file.save(filepath)
        
        new_pdf = PdfTemplate(
            original_filename=original_filename,
            stored_filename=unique_filename
        )
        db.session.add(new_pdf)
        db.session.commit()
        return new_pdf

    @staticmethod
    def delete_pdf_template(pdf_template, upload_folder):
        """Deletes a PDF template and its associated file."""
        settings = AppSettings.query.get(1)
        if settings and settings.default_pdf_id == pdf_template.id:
            raise ValueError('Cannot delete default PDF template. Please set another default first.')

        filepath = os.path.join(upload_folder, pdf_template.stored_filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            
        db.session.delete(pdf_template)
        db.session.commit()

class AppSettingsService:
    @staticmethod
    def get_app_settings():
        """Retrieves application settings, eager loading the default PDF template."""
        return AppSettings.query.options(joinedload(AppSettings.default_pdf)).get(1)

    @staticmethod
    def set_default_pdf(default_pdf_id):
        """Sets the default PDF template in application settings."""
        if default_pdf_id is not None:
            pdf_exists = PdfTemplate.query.get(default_pdf_id)
            if not pdf_exists:
                raise ValueError('Selected PDF template does not exist.')

        settings = AppSettings.query.get(1)
        if not settings:
            settings = AppSettings(id=1)
            db.session.add(settings)
        
        settings.default_pdf_id = default_pdf_id
        db.session.commit()
        db.session.refresh(settings)
        return settings
