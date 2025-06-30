# backend/app.py
# This is the main Flask application for the network documentation backend.
# It defines the database models, API endpoints, and handles CRUD operations.

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS # For handling Cross-Origin Resource Sharing
from sqlalchemy.orm import joinedload # To eager load related data

import os

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Database configuration
# Using SQLite for simplicity. The database file will be stored in the 'instance' folder.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///network_doc.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# --- Database Models ---
# Define the structure of your data tables.

class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

class PC(db.Model):
    __tablename__ = 'pcs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100), nullable=True)
    username = db.Column(db.String(100), nullable=True) # New field
    in_domain = db.Column(db.Boolean, nullable=False, default=False) # New field
    operating_system = db.Column(db.String(100), nullable=True) # New field
    ports_name = db.Column(db.String(255), nullable=True) # New field
    office = db.Column(db.String(100), nullable=True) # New field: Office
    description = db.Column(db.String(255), nullable=True) # Changed to optional

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'username': self.username,
            'in_domain': self.in_domain,
            'operating_system': self.operating_system,
            'ports_name': self.ports_name,
            'office': self.office, # Include new field
            'description': self.description
        }

class PatchPanel(db.Model):
    __tablename__ = 'patch_panels'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    location = db.relationship('Location', backref='patch_panels_in_location', lazy=True)
    row_in_rack = db.Column(db.String(50), nullable=True) # New field
    rack_name = db.Column(db.String(100), nullable=True) # New field
    total_ports = db.Column(db.Integer, nullable=False, default=1)
    description = db.Column(db.String(255), nullable=True) # New field

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'row_in_rack': self.row_in_rack,
            'rack_name': self.rack_name,
            'total_ports': self.total_ports,
            'description': self.description
        }

class Switch(db.Model):
    __tablename__ = 'switches'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100), nullable=True) # Changed to optional
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    location = db.relationship('Location', backref='switches_in_location', lazy=True)
    row_in_rack = db.Column(db.String(50), nullable=True) # New field
    rack_name = db.Column(db.String(100), nullable=True) # New field
    total_ports = db.Column(db.Integer, nullable=False, default=1)
    source_port = db.Column(db.String(100), nullable=True) # New field
    model = db.Column(db.String(100), nullable=True) # New field
    description = db.Column(db.String(255), nullable=True) # New field

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'row_in_rack': self.row_in_rack,
            'rack_name': self.rack_name,
            'total_ports': self.total_ports,
            'source_port': self.source_port,
            'model': self.model,
            'description': self.description
        }

class Connection(db.Model):
    __tablename__ = 'connections'
    id = db.Column(db.Integer, primary_key=True)
    pc_id = db.Column(db.Integer, db.ForeignKey('pcs.id'), nullable=False)
    switch_id = db.Column(db.Integer, db.ForeignKey('switches.id'), nullable=False)
    switch_port = db.Column(db.String(50), nullable=False)
    is_switch_port_up = db.Column(db.Boolean, nullable=False, default=True)

    pc = db.relationship('PC', backref='connections_as_pc', lazy=True)
    switch = db.relationship('Switch', backref='connections_as_switch', lazy=True)
    hops = db.relationship('ConnectionHop', backref='connection', lazy=True, cascade="all, delete-orphan", order_by="ConnectionHop.sequence")


    def to_dict(self):
        return {
            'id': self.id,
            'pc': self.pc.to_dict() if self.pc else None,
            'hops': [hop.to_dict() for hop in self.hops],
            'switch': self.switch.to_dict() if self.switch else None,
            'switch_port': self.switch_port,
            'is_switch_port_up': self.is_switch_port_up
        }

class ConnectionHop(db.Model):
    __tablename__ = 'connection_hops'
    id = db.Column(db.Integer, primary_key=True)
    connection_id = db.Column(db.Integer, db.ForeignKey('connections.id'), nullable=False)
    patch_panel_id = db.Column(db.Integer, db.ForeignKey('patch_panels.id'), nullable=False)
    patch_panel_port = db.Column(db.String(50), nullable=False)
    is_port_up = db.Column(db.Boolean, nullable=False, default=True)
    sequence = db.Column(db.Integer, nullable=False)

    patch_panel = db.relationship('PatchPanel', backref='connection_hops', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'patch_panel': self.patch_panel.to_dict() if self.patch_panel else None,
            'patch_panel_port': self.patch_panel_port,
            'is_port_up': self.is_port_up,
            'sequence': self.sequence
        }

# --- API Endpoints ---

@app.route('/')
def index():
    return "Welcome to the Network Documentation Backend API!"

# Helper function for port validation
def validate_port_occupancy(target_id, port_number, entity_type, exclude_connection_id=None):
    """
    Checks if a given port on a patch panel or switch is already in use.
    Returns (True, conflicting_pc_name) if occupied, (False, None) if available.
    """
    if entity_type == 'patch_panel':
        conflicting_hops = ConnectionHop.query.options(joinedload(ConnectionHop.connection).joinedload(Connection.pc)).filter(
            ConnectionHop.patch_panel_id == target_id,
            ConnectionHop.patch_panel_port == port_number
        )
        if exclude_connection_id:
            conflicting_hops = conflicting_hops.filter(ConnectionHop.connection_id != exclude_connection_id)
        
        conflicting_hop = conflicting_hops.first()
        if conflicting_hop:
            return True, conflicting_hop.connection.pc.name if conflicting_hop.connection.pc else "Unknown PC"
    elif entity_type == 'switch':
        conflicting_connections = Connection.query.options(joinedload(Connection.pc)).filter(
            Connection.switch_id == target_id,
            Connection.switch_port == port_number
        )
        if exclude_connection_id:
            conflicting_connections = conflicting_connections.filter(Connection.id != exclude_connection_id)
        
        conflicting_connection = conflicting_connections.first()
        if conflicting_connection:
            return True, conflicting_connection.pc.name if conflicting_connection.pc else "Unknown PC"
    return False, None

# Location Endpoints
@app.route('/locations', methods=['GET', 'POST'])
def handle_locations():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Location name is required'}), 400
        new_location = Location(name=data['name'])
        try:
            db.session.add(new_location)
            db.session.commit()
            return jsonify(new_location.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        locations = Location.query.all()
        return jsonify([location.to_dict() for location in locations])

@app.route('/locations/<int:location_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_location_by_id(location_id):
    location = Location.query.get_or_404(location_id)
    if request.method == 'GET':
        return jsonify(location.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Location name is required'}), 400
        location.name = data.get('name', location.name)
        try:
            db.session.commit()
            return jsonify(location.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # DELETE
        try:
            db.session.delete(location)
            db.session.commit()
            return jsonify({'message': 'Location deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


# PC Endpoints (updated to handle new fields)
@app.route('/pcs', methods=['GET', 'POST'])
def handle_pcs():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'PC name is required'}), 400
        new_pc = PC(
            name=data['name'],
            ip_address=data.get('ip_address'),
            username=data.get('username'),
            in_domain=data.get('in_domain', False),
            operating_system=data.get('operating_system'),
            ports_name=data.get('ports_name'),
            office=data.get('office'), # Handle new field
            description=data.get('description')
        )
        try:
            db.session.add(new_pc)
            db.session.commit()
            return jsonify(new_pc.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        pcs = PC.query.all()
        return jsonify([pc.to_dict() for pc in pcs])

@app.route('/pcs/<int:pc_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_pc_by_id(pc_id):
    pc = PC.query.get_or_404(pc_id)
    if request.method == 'GET':
        return jsonify(pc.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400
        pc.name = data.get('name', pc.name)
        pc.ip_address = data.get('ip_address', pc.ip_address)
        pc.username = data.get('username', pc.username)
        pc.in_domain = data.get('in_domain', pc.in_domain)
        pc.operating_system = data.get('operating_system', pc.operating_system)
        pc.ports_name = data.get('ports_name', pc.ports_name)
        pc.office = data.get('office', pc.office) # Handle new field
        pc.description = data.get('description', pc.description)
        try:
            db.session.commit()
            return jsonify(pc.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # DELETE
        try:
            db.session.delete(pc)
            db.session.commit()
            return jsonify({'message': 'PC deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

# Patch Panel Endpoints (updated to handle new fields)
@app.route('/patch_panels', methods=['GET', 'POST'])
def handle_patch_panels():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Patch Panel name is required'}), 400
        total_ports = int(data.get('total_ports', 1)) if str(data.get('total_ports', 1)).isdigit() else 1
        new_pp = PatchPanel(
            name=data['name'],
            location_id=data.get('location_id'),
            row_in_rack=data.get('row_in_rack'),
            rack_name=data.get('rack_name'),
            total_ports=total_ports,
            description=data.get('description')
        )
        try:
            db.session.add(new_pp)
            db.session.commit()
            return jsonify(new_pp.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        patch_panels = PatchPanel.query.options(joinedload(PatchPanel.location)).all()
        return jsonify([pp.to_dict() for pp in patch_panels])

@app.route('/patch_panels/<int:pp_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_patch_panel_by_id(pp_id):
    pp = PatchPanel.query.get_or_404(pp_id)
    if request.method == 'GET':
        return jsonify(pp.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400
        pp.name = data.get('name', pp.name)
        pp.location_id = data.get('location_id', pp.location_id)
        pp.row_in_rack = data.get('row_in_rack', pp.row_in_rack)
        pp.rack_name = data.get('rack_name', pp.rack_name)
        pp.total_ports = int(data.get('total_ports', pp.total_ports)) if str(data.get('total_ports', pp.total_ports)).isdigit() else pp.total_ports
        pp.description = data.get('description', pp.description)
        try:
            db.session.commit()
            return jsonify(pp.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # DELETE
        try:
            db.session.delete(pp)
            db.session.commit()
            return jsonify({'message': 'Patch Panel deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

# Switch Endpoints (updated to handle new fields)
@app.route('/switches', methods=['GET', 'POST'])
def handle_switches():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Switch name is required'}), 400
        total_ports = int(data.get('total_ports', 1)) if str(data.get('total_ports', 1)).isdigit() else 1
        new_switch = Switch(
            name=data['name'],
            ip_address=data.get('ip_address'),
            location_id=data.get('location_id'),
            row_in_rack=data.get('row_in_rack'),
            rack_name=data.get('rack_name'),
            total_ports=total_ports,
            source_port=data.get('source_port'),
            model=data.get('model'),
            description=data.get('description')
        )
        try:
            db.session.add(new_switch)
            db.session.commit()
            return jsonify(new_switch.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        switches = Switch.query.options(joinedload(Switch.location)).all()
        return jsonify([_switch.to_dict() for _switch in switches])

@app.route('/switches/<int:switch_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_switch_by_id(switch_id):
    _switch = Switch.query.get_or_404(switch_id)
    if request.method == 'GET':
        return jsonify(_switch.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400
        _switch.name = data.get('name', _switch.name)
        _switch.ip_address = data.get('ip_address', _switch.ip_address)
        _switch.location_id = data.get('location_id', _switch.location_id)
        _switch.row_in_rack = data.get('row_in_rack', _switch.row_in_rack)
        _switch.rack_name = data.get('rack_name', _switch.rack_name)
        _switch.total_ports = int(data.get('total_ports', _switch.total_ports)) if str(data.get('total_ports', _switch.total_ports)).isdigit() else _switch.total_ports
        _switch.source_port = data.get('source_port', _switch.source_port)
        _switch.model = data.get('model', _switch.model)
        _switch.description = data.get('description', _switch.description)
        try:
            db.session.commit()
            return jsonify(_switch.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # DELETE
        try:
            db.session.delete(_switch)
            db.session.commit()
            return jsonify({'message': 'Switch deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

# Connection Endpoints
@app.route('/connections', methods=['GET', 'POST'])
def handle_connections():
    if request.method == 'POST':
        data = request.json
        required_fields = ['pc_id', 'switch_id', 'switch_port', 'is_switch_port_up', 'hops']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields for connection'}), 400

        # Validate Switch Port occupancy
        is_occupied, conflicting_pc = validate_port_occupancy(
            target_id=data['switch_id'],
            port_number=data['switch_port'],
            entity_type='switch'
        )
        if is_occupied:
            return jsonify({'error': f'Switch port {data["switch_port"]} is already in use by PC: {conflicting_pc}'}), 409 # Conflict

        new_connection = Connection(
            pc_id=data['pc_id'],
            switch_id=data['switch_id'],
            switch_port=data['switch_port'],
            is_switch_port_up=data['is_switch_port_up']
        )
        db.session.add(new_connection)
        db.session.flush() # Flush to get new_connection.id for hops

        # Add and validate hops
        for idx, hop_data in enumerate(data['hops']):
            if not all(f in hop_data for f in ['patch_panel_id', 'patch_panel_port', 'is_port_up']):
                db.session.rollback()
                return jsonify({'error': f'Missing fields for hop {idx}'}), 400

            # Validate Patch Panel Port occupancy
            is_occupied, conflicting_pc = validate_port_occupancy(
                target_id=hop_data['patch_panel_id'],
                port_number=hop_data['patch_panel_port'],
                entity_type='patch_panel'
            )
            if is_occupied:
                db.session.rollback()
                return jsonify({'error': f'Patch Panel port {hop_data["patch_panel_port"]} on Patch Panel ID {hop_data["patch_panel_id"]} is already in use by PC: {conflicting_pc}'}), 409 # Conflict

            new_hop = ConnectionHop(
                connection_id=new_connection.id,
                patch_panel_id=hop_data['patch_panel_id'],
                patch_panel_port=hop_data['patch_panel_port'],
                is_port_up=hop_data['is_port_up'],
                sequence=idx
            )
            db.session.add(new_hop)

        try:
            db.session.commit()
            db.session.refresh(new_connection) # Refresh to load related hops and objects
            return jsonify(new_connection.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        # Eager load related data to avoid N+1 queries when converting to dicts
        connections = Connection.query.options(
            joinedload(Connection.pc),
            joinedload(Connection.switch).joinedload(Switch.location), # Eager load switch location
            joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.location) # Eager load patch panel location
        ).all()
        return jsonify([conn.to_dict() for conn in connections])

@app.route('/connections/<int:conn_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_connection_by_id(conn_id):
    connection = Connection.query.get_or_404(conn_id)
    if request.method == 'GET':
        return jsonify(connection.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400

        # Validate Switch Port occupancy (excluding current connection)
        if 'switch_id' in data and 'switch_port' in data:
            is_occupied, conflicting_pc = validate_port_occupancy(
                target_id=data['switch_id'],
                port_number=data['switch_port'],
                entity_type='switch',
                exclude_connection_id=conn_id
            )
            if is_occupied:
                return jsonify({'error': f'Switch port {data["switch_port"]} is already in use by PC: {conflicting_pc}'}), 409

        connection.pc_id = data.get('pc_id', connection.pc_id)
        connection.switch_id = data.get('switch_id', connection.switch_id)
        connection.switch_port = data.get('switch_port', connection.switch_port)
        connection.is_switch_port_up = data.get('is_switch_port_up', connection.is_switch_port_up)

        # Handle hops update: delete existing and re-add
        if 'hops' in data:
            # Delete existing hops
            for hop in connection.hops:
                db.session.delete(hop)
            db.session.flush() # Ensure deletions are processed before adding new

            # Add new hops with validation
            for idx, hop_data in enumerate(data['hops']):
                if not all(f in hop_data for f in ['patch_panel_id', 'patch_panel_port', 'is_port_up']):
                    db.session.rollback()
                    return jsonify({'error': f'Missing fields for hop {idx}'}), 400

                # Validate Patch Panel Port occupancy (excluding current connection's hops)
                is_occupied, conflicting_pc = validate_port_occupancy(
                    target_id=hop_data['patch_panel_id'],
                    port_number=hop_data['patch_panel_port'],
                    entity_type='patch_panel',
                    exclude_connection_id=conn_id
                )
                if is_occupied:
                    db.session.rollback()
                    return jsonify({'error': f'Patch Panel port {hop_data["patch_panel_port"]} on Patch Panel ID {hop_data["patch_panel_id"]} is already in use by PC: {conflicting_pc}'}), 409

                new_hop = ConnectionHop(
                    connection_id=connection.id,
                    patch_panel_id=hop_data['patch_panel_id'],
                    patch_panel_port=hop_data['patch_panel_port'],
                    is_port_up=hop_data['is_port_up'],
                    sequence=idx
                )
                db.session.add(new_hop)

        try:
            db.session.commit()
            db.session.refresh(connection) # Refresh to get updated related objects
            return jsonify(connection.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # DELETE
        try:
            db.session.delete(connection)
            db.session.commit()
            return jsonify({'message': 'Connection deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

# New API Endpoints for Port Availability
@app.route('/patch_panels/<int:pp_id>/ports', methods=['GET'])
def get_patch_panel_ports(pp_id):
    patch_panel = PatchPanel.query.options(joinedload(PatchPanel.location)).get_or_404(pp_id)
    
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
    
    return jsonify({
        'patch_panel_id': pp_id,
        'patch_panel_name': patch_panel.name,
        'patch_panel_location': patch_panel.location.name if patch_panel.location else None,
        'total_ports': patch_panel.total_ports,
        'ports': port_status
    })

@app.route('/switches/<int:switch_id>/ports', methods=['GET'])
def get_switch_ports(switch_id):
    _switch = Switch.query.options(joinedload(Switch.location)).get_or_404(switch_id)
    
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
    
    return jsonify({
        'switch_id': switch_id,
        'switch_name': _switch.name,
        'switch_location': _switch.location.name if _switch.location else None,
        'total_ports': _switch.total_ports,
        'ports': port_status
    })


if __name__ == '__main__':
    # Ensure the instance directory exists for SQLite database
    instance_path = os.path.join(app.root_path, 'instance')
    os.makedirs(instance_path, exist_ok=True)
    # The 'flask db upgrade' command in docker-compose handles initial migration
    # and database creation.
    app.run(debug=True, host='0.0.0.0')