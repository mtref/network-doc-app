# backend/app.py
# This is the main Flask application for the network documentation backend.
# It defines the database models, API endpoints, and handles CRUD operations.

import io
import csv
from flask import Flask, request, jsonify, make_response
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

# --- Global Constants ---
MAX_HOPS = 5 # Maximum number of hops to export/import for connections

# --- Database Models ---
# Define the structure of your data tables.

class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    door_number = db.Column(db.String(50), nullable=True) # New field

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'door_number': self.door_number
        }

class Rack(db.Model): # New Rack model
    __tablename__ = 'racks'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    location = db.relationship('Location', backref='racks_in_location', lazy=True)
    description = db.Column(db.String(255), nullable=True)
    total_units = db.Column(db.Integer, nullable=False, default=42) # NEW FIELD: Total U units in the rack

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'location': self.location.to_dict() if self.location else None, # Include full location object for frontend filtering
            'description': self.description,
            'total_units': self.total_units, # NEW: Include total_units
        }

class PC(db.Model):
    __tablename__ = 'pcs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100), nullable=True)
    username = db.Column(db.String(100), nullable=True)
    in_domain = db.Column(db.Boolean, nullable=False, default=False)
    operating_system = db.Column(db.String(100), nullable=True)
    model = db.Column(db.String(255), nullable=True) # Renamed from ports_name to model
    office = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(255), nullable=True)
    multi_port = db.Column(db.Boolean, nullable=False, default=False)
    type = db.Column(db.String(50), nullable=False, default='Workstation') # New field
    usage = db.Column(db.String(100), nullable=True) # New field

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'username': self.username,
            'in_domain': self.in_domain,
            'operating_system': self.operating_system,
            'model': self.model, # Updated to model
            'office': self.office,
            'description': self.description,
            'multi_port': self.multi_port,
            'type': self.type, # Include new field
            'usage': self.usage # Include new field
        }

class PatchPanel(db.Model):
    __tablename__ = 'patch_panels'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    location = db.relationship('Location', backref='patch_panels_in_location', lazy=True)
    row_in_rack = db.Column(db.String(50), nullable=True)
    rack_name = db.Column(db.String(100), nullable=True) # Kept for older data compatibility/display
    rack_id = db.Column(db.Integer, db.ForeignKey('racks.id'), nullable=True) # New field
    rack = db.relationship('Rack', backref='patch_panels_in_rack', lazy=True) # Relationship to Rack
    total_ports = db.Column(db.Integer, nullable=False, default=1)
    description = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'row_in_rack': self.row_in_rack,
            'rack_id': self.rack_id, # Include rack_id
            'rack_name': self.rack.name if self.rack else None, # Use self.rack.name via relationship
            'total_ports': self.total_ports,
            'description': self.description,
            'location': self.location.to_dict() if self.location else None, # Include full location object
            'rack': self.rack.to_dict() if self.rack else None, # Include full rack object
        }

class Switch(db.Model):
    __tablename__ = 'switches'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100), nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    location = db.relationship('Location', backref='switches_in_location', lazy=True)
    row_in_rack = db.Column(db.String(50), nullable=True)
    rack_name = db.Column(db.String(100), nullable=True) # Kept for older data compatibility/display
    rack_id = db.Column(db.Integer, db.ForeignKey('racks.id'), nullable=True) # New field to link to Rack
    rack = db.relationship('Rack', backref='switches_in_rack', lazy=True) # Relationship to Rack
    total_ports = db.Column(db.Integer, nullable=False, default=1)
    source_port = db.Column(db.String(100), nullable=True)
    model = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(255), nullable=True)
    usage = db.Column(db.String(100), nullable=True) # New field

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'row_in_rack': self.row_in_rack,
            'rack_id': self.rack_id, # Include rack_id
            'rack_name': self.rack.name if self.rack else None, # Use self.rack.name via relationship
            'total_ports': self.total_ports,
            'source_port': self.source_port,
            'model': self.model,
            'description': self.description,
            'usage': self.usage, # Include new field
            'location': self.location.to_dict() if self.location else None, # Include full location object
            'rack': self.rack.to_dict() if self.rack else None, # Include full rack object
        }

class Connection(db.Model):
    __tablename__ = 'connections'
    id = db.Column(db.Integer, primary_key=True)
    pc_id = db.Column(db.Integer, db.ForeignKey('pcs.id'), nullable=False)
    switch_id = db.Column(db.Integer, db.ForeignKey('switches.id'), nullable=False)
    switch_port = db.Column(db.String(50), nullable=False)
    is_switch_port_up = db.Column(db.Boolean, nullable=False, default=True)
    cable_color = db.Column(db.String(50), nullable=True) # New field
    cable_label = db.Column(db.String(100), nullable=True) # New field

    pc = db.relationship('PC', backref='connections_as_pc', lazy=True)
    switch = db.relationship('Switch', backref='connections_as_switch', lazy=True)
    hops = db.relationship('ConnectionHop', backref='connection', lazy=True, cascade="all, delete-orphan", order_by="ConnectionHop.sequence")


    def to_dict(self):
        return {
            'id': self.id,
            'pc_id': self.pc_id,
            'switch_id': self.switch_id,
            'pc': self.pc.to_dict() if self.pc else None,
            'hops': [hop.to_dict() for hop in self.hops],
            'switch': self.switch.to_dict() if self.switch else None,
            'switch_port': self.switch_port,
            'is_switch_port_up': self.is_switch_port_up,
            'cable_color': self.cable_color, # Include new field
            'cable_label': self.cable_label # Include new field
        }

class ConnectionHop(db.Model):
    __tablename__ = 'connection_hops'
    id = db.Column(db.Integer, primary_key=True)
    connection_id = db.Column(db.Integer, db.ForeignKey('connections.id'), nullable=False)
    patch_panel_id = db.Column(db.Integer, db.ForeignKey('patch_panels.id'), nullable=False)
    patch_panel_port = db.Column(db.String(50), nullable=False)
    is_port_up = db.Column(db.Boolean, nullable=False, default=True)
    sequence = db.Column(db.Integer, nullable=False)
    cable_color = db.Column(db.String(50), nullable=True) # New field
    cable_label = db.Column(db.String(100), nullable=True) # New field

    patch_panel = db.relationship('PatchPanel', backref='connection_hops', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'patch_panel': self.patch_panel.to_dict() if self.patch_panel else None,
            'patch_panel_port': self.patch_panel_port,
            'is_port_up': self.is_port_up,
            'sequence': self.sequence,
            'cable_color': self.cable_color, # Include new field
            'cable_label': self.cable_label # Include new field
        }

# --- API Endpoints ---

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
        new_location = Location(
            name=data['name'],
            door_number=data.get('door_number') # Handle new field
        )
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
        location.door_number = data.get('door_number', location.door_number) # Handle new field
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

# Rack Endpoints (New)
@app.route('/racks', methods=['GET', 'POST'])
def handle_racks():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name') or not data.get('location_id'):
            return jsonify({'error': 'Rack name and location_id are required'}), 400
        # Validate total_units is an integer and within a reasonable range (e.g., 1 to 50)
        total_units = data.get('total_units', 42) # Default to 42 if not provided
        try:
            total_units = int(total_units)
            if not (1 <= total_units <= 50): # Example range, adjust as needed
                return jsonify({'error': 'Total units must be an integer between 1 and 50.'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Total units must be a valid integer.'}), 400

        new_rack = Rack(
            name=data['name'],
            location_id=data['location_id'],
            description=data.get('description'),
            total_units=total_units, # NEW: Set total_units
        )
        try:
            db.session.add(new_rack)
            db.session.commit()
            # After commit, ensure location relationship is loaded for to_dict
            db.session.refresh(new_rack)
            return jsonify(new_rack.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        racks = Rack.query.options(joinedload(Rack.location)).all()
        return jsonify([rack.to_dict() for rack in racks])

@app.route('/racks/<int:rack_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_rack_by_id(rack_id):
    rack = Rack.query.options(joinedload(Rack.location)).get_or_404(rack_id) # Eager load for PUT/GET
    if request.method == 'GET':
        return jsonify(rack.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data or not data.get('name') or not data.get('location_id'):
            return jsonify({'error': 'Rack name and location_id are required'}), 400
        
        # Validate total_units if provided in PUT request
        if 'total_units' in data:
            total_units = data.get('total_units')
            try:
                total_units = int(total_units)
                if not (1 <= total_units <= 50):
                    return jsonify({'error': 'Total units must be an integer between 1 and 50.'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Total units must be a valid integer.'}), 400
            rack.total_units = total_units # NEW: Update total_units
        
        rack.name = data.get('name', rack.name)
        rack.location_id = data.get('location_id', rack.location_id)
        rack.description = data.get('description', rack.description)
        try:
            db.session.commit()
            db.session.refresh(rack) # Refresh to load updated location relationship if needed
            return jsonify(rack.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # DELETE
        try:
            db.session.delete(rack)
            db.session.commit()
            return jsonify({'message': 'Rack deleted successfully'}), 200
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
            model=data.get('model'), # Updated to model
            office=data.get('office'),
            description=data.get('description'),
            multi_port=data.get('multi_port', False),
            type=data.get('type', 'Workstation'), # New field
            usage=data.get('usage') # New field
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
        pc.model = data.get('model', pc.model) # Updated to model
        pc.office = data.get('office', pc.office)
        pc.description = data.get('description', pc.description)
        pc.multi_port = data.get('multi_port', pc.multi_port)
        pc.type = data.get('type', pc.type) # New field
        pc.usage = data.get('usage', pc.usage) # New field
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

# New endpoint to get available PCs for new connections
@app.route('/available_pcs', methods=['GET'])
def get_available_pcs():
    all_pcs = PC.query.all()
    all_connections = Connection.query.options(joinedload(Connection.pc)).all() # Eager load PC for multi_port check

    # Get IDs of PCs that are currently connected and are single-port
    # Filter connections where pc is not null and multi_port is False
    connected_single_port_pc_ids = {conn.pc_id for conn in all_connections if conn.pc and not conn.pc.multi_port}

    available_pcs = []
    for pc in all_pcs:
        # If PC is multi-port, it's always available
        # If PC is single-port, it's available only if not already connected
        if pc.multi_port or pc.id not in connected_single_port_pc_ids:
            available_pcs.append(pc.to_dict())
            
    return jsonify(available_pcs)


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
            rack_id=data.get('rack_id'), # Use rack_id
            # rack_name will be derived from rack_id relationship
            total_ports=total_ports,
            description=data.get('description')
        )
        try:
            db.session.add(new_pp)
            db.session.commit()
            db.session.refresh(new_pp) # Refresh to load relationships
            return jsonify(new_pp.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        patch_panels = PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).all()
        return jsonify([pp.to_dict() for pp in patch_panels])

@app.route('/patch_panels/<int:pp_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_patch_panel_by_id(pp_id):
    pp = PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).get_or_404(pp_id)
    if request.method == 'GET':
        return jsonify(pp.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400
        pp.name = data.get('name', pp.name)
        pp.location_id = data.get('location_id', pp.location_id)
        pp.row_in_rack = data.get('row_in_rack', pp.row_in_rack)
        pp.rack_id = data.get('rack_id', pp.rack_id) # Use rack_id
        pp.total_ports = int(data.get('total_ports', pp.total_ports)) if str(data.get('total_ports', pp.total_ports)).isdigit() else pp.total_ports
        pp.description = data.get('description', pp.description)
        try:
            db.session.commit()
            db.session.refresh(pp) # Refresh to load relationships
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
            rack_id=data.get('rack_id'), # Use rack_id
            # rack_name will be derived from rack_id relationship
            total_ports=total_ports,
            source_port=data.get('source_port'),
            model=data.get('model'),
            description=data.get('description'),
            usage=data.get('usage') # Handle new field
        )
        try:
            db.session.add(new_switch)
            db.session.commit()
            db.session.refresh(new_switch) # Refresh to load relationships
            return jsonify(new_switch.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        switches = Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).all()
        return jsonify([_switch.to_dict() for _switch in switches])

@app.route('/switches/<int:switch_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_switch_by_id(switch_id):
    _switch = Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).get_or_404(switch_id)
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
        _switch.rack_id = data.get('rack_id', _switch.rack_id) # Use rack_id
        _switch.total_ports = int(data.get('total_ports', _switch.total_ports)) if str(data.get('total_ports', _switch.total_ports)).isdigit() else _switch.total_ports
        _switch.source_port = data.get('source_port', _switch.source_port)
        _switch.model = data.get('model', _switch.model)
        _switch.description = data.get('description', _switch.description)
        _switch.usage = data.get('usage', _switch.usage) # Handle new field
        try:
            db.session.commit()
            db.session.refresh(_switch) # Refresh to load relationships
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

        # Validate PC availability for single-port PCs
        pc = PC.query.get(data['pc_id'])
        if pc and not pc.multi_port:
            existing_connection_for_pc = Connection.query.filter_by(pc_id=pc.id).first()
            if existing_connection_for_pc:
                return jsonify({'error': f"PC '{pc.name}' is a single-port device and is already connected. Cannot create new connection."}), 409

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
            is_switch_port_up=data['is_switch_port_up'],
            cable_color=data.get('cable_color'), # Handle new field
            cable_label=data.get('cable_label') # Handle new field
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
                sequence=idx,
                cable_color=hop_data.get('cable_color'), # Handle new field
                cable_label=hop_data.get('cable_label') # Handle new field
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
            joinedload(Connection.switch).joinedload(Switch.location),
            joinedload(Connection.switch).joinedload(Switch.rack), # Eager load switch rack
            joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.location),
            joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.rack) # Eager load patch panel rack
        ).all()
        return jsonify([conn.to_dict() for conn in connections])

@app.route('/connections/<int:conn_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_connection_by_id(conn_id):
    connection = Connection.query.options(
        joinedload(Connection.pc),
        joinedload(Connection.switch).joinedload(Switch.location),
        joinedload(Connection.switch).joinedload(Switch.rack),
        joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.location),
        joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.rack)
    ).get_or_404(conn_id)

    if request.method == 'GET':
        return jsonify(connection.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400

        # Validate PC availability for single-port PCs during update
        new_pc_id = data.get('pc_id', connection.pc_id)
        if new_pc_id != connection.pc_id: # PC is being changed
            new_pc = PC.query.get(new_pc_id)
            if new_pc and not new_pc.multi_port:
                existing_connection_for_new_pc = Connection.query.filter(
                    Connection.pc_id == new_pc.id,
                    Connection.id != conn_id
                ).first()
                if existing_connection_for_new_pc:
                    return jsonify({'error': f"PC '{new_pc.name}' is a single-port device and is already connected in another connection. Cannot update."}), 409

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
        connection.cable_color = data.get('cable_color', connection.cable_color) # Handle new field
        connection.cable_label = data.get('cable_label', connection.cable_label) # Handle new field

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
                    sequence=idx,
                    cable_color=hop_data.get('cable_color'), # Handle new field
                    cable_label=hop_data.get('cable_label') # Handle new field
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
    patch_panel = PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).get_or_404(pp_id)
    
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
        'row_in_rack': patch_panel.row_in_rack, # Include existing fields for modal
        'rack_name': patch_panel.rack.name if patch_panel.rack else None, # Use relationship
        'description': patch_panel.description, # Include existing fields for modal
        'total_ports': patch_panel.total_ports,
        'location': patch_panel.location.to_dict() if patch_panel.location else None, # full location obj
        'rack': patch_panel.rack.to_dict() if patch_panel.rack else None, # full rack obj
        'ports': port_status
    })

@app.route('/switches/<int:switch_id>/ports', methods=['GET'])
def get_switch_ports(switch_id):
    _switch = Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).get_or_404(switch_id)
    
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
        'ip_address': _switch.ip_address, # Include existing fields for modal
        'row_in_rack': _switch.row_in_rack, # Include existing fields for modal
        'rack_name': _switch.rack.name if _switch.rack else None, # Use relationship
        'source_port': _switch.source_port, # Include existing fields for modal
        'model': _switch.model, # Include existing fields for modal
        'description': _switch.description, # Include existing fields for modal
        'total_ports': _switch.total_ports,
        'location': _switch.location.to_dict() if _switch.location else None, # full location obj
        'rack': _switch.rack.to_dict() if _switch.rack else None, # full rack obj
        'ports': port_status
    })

# --- New CSV Export Endpoints ---

@app.route('/export/<entity_type>', methods=['GET'])
def export_data(entity_type):
    si = io.StringIO()
    cw = csv.writer(si)

    headers = []
    data_rows = []

    try:
        if entity_type == 'locations':
            headers = ['id', 'name', 'door_number']
            locations = Location.query.all()
            data_rows = [[loc.id, loc.name, loc.door_number] for loc in locations]
            filename = 'locations.csv'
        elif entity_type == 'racks':
            headers = ['id', 'name', 'location_id', 'location_name', 'location_door_number', 'description', 'total_units'] # NEW: total_units
            racks = Rack.query.options(joinedload(Rack.location)).all()
            data_rows = [[r.id, r.name, r.location_id, r.location.name if r.location else '', r.location.door_number if r.location else '', r.description, r.total_units] for r in racks] # NEW: total_units
            filename = 'racks.csv'
        elif entity_type == 'pcs':
            headers = ['id', 'name', 'ip_address', 'username', 'in_domain', 'operating_system', 'model', 'office', 'description', 'multi_port', 'type', 'usage']
            pcs = PC.query.all()
            data_rows = [[pc.id, pc.name, pc.ip_address, pc.username, pc.in_domain, pc.operating_system, pc.model, pc.office, pc.description, pc.multi_port, pc.type, pc.usage] for pc in pcs]
            filename = 'pcs.csv'
        elif entity_type == 'patch_panels':
            headers = ['id', 'name', 'location_id', 'location_name', 'location_door_number', 'row_in_rack', 'rack_id', 'rack_name', 'total_ports', 'description']
            patch_panels = PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).all()
            data_rows = [[pp.id, pp.name, pp.location_id, pp.location.name if pp.location else '', pp.location.door_number if pp.location else '', pp.row_in_rack, pp.rack_id, pp.rack.name if pp.rack else '', pp.total_ports, pp.description] for pp in patch_panels]
            filename = 'patch_panels.csv'
        elif entity_type == 'switches':
            headers = ['id', 'name', 'ip_address', 'location_id', 'location_name', 'location_door_number', 'row_in_rack', 'rack_id', 'rack_name', 'total_ports', 'source_port', 'model', 'description', 'usage']
            switches = Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).all()
            data_rows = [[s.id, s.name, s.ip_address, s.location_id, s.location.name if s.location else '', s.location.door_number if s.location else '', s.row_in_rack, s.rack_id, s.rack.name if s.rack else '', s.total_ports, s.source_port, s.model, s.description, s.usage] for s in switches]
            filename = 'switches.csv'
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

            all_connections = Connection.query.options(
                joinedload(Connection.pc),
                joinedload(Connection.switch).joinedload(Switch.location),
                joinedload(Connection.switch).joinedload(Switch.rack),
                joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.location),
                joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.rack)
            ).all()

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
                        row.extend(['', '', '', '', '', '', '', '', '', '', '']) # Fill with empty strings for missing hop details
                data_rows.append(row)
            filename = 'connections.csv'
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


# --- New CSV Import Endpoint ---

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

    # Define mapping for incoming CSV columns to DB model fields
    # And conversion functions for specific types/relationships
    field_maps = {
        'locations': {
            'name': 'name',
            'door_number': 'door_number'
        },
        'racks': {
            'name': 'name',
            'location_name': lambda x: Location.query.filter_by(name=x).first().id if Location.query.filter_by(name=x).first() else None,
            'description': 'description',
            'total_units': lambda x: int(x) if x.isdigit() else 42, # NEW: import total_units
        },
        'pcs': {
            'name': 'name', 'ip_address': 'ip_address', 'username': 'username',
            'in_domain': lambda x: x.lower() == 'true',
            'operating_system': 'operating_system', 'model': 'model',
            'office': 'office', 'description': 'description',
            'multi_port': lambda x: x.lower() == 'true',
            'type': 'type',
            'usage': 'usage'
        },
        'patch_panels': {
            'name': 'name',
            'location_name': lambda x: Location.query.filter_by(name=x).first().id if Location.query.filter_by(name=x).first() else None,
            'row_in_rack': 'row_in_rack',
            'rack_name': lambda x: Rack.query.filter_by(name=x).first().id if Rack.query.filter_by(name=x).first() else None, # Map rack_name to rack_id
            'total_ports': lambda x: int(x) if x.isdigit() else 1,
            'description': 'description'
        },
        'switches': {
            'name': 'name', 'ip_address': 'ip_address',
            'location_name': lambda x: Location.query.filter_by(name=x).first().id if Location.query.filter_by(name=x).first() else None,
            'row_in_rack': 'row_in_rack',
            'rack_name': lambda x: Rack.query.filter_by(name=x).first().id if Rack.query.filter_by(name=x).first() else None, # Map rack_name to rack_id
            'total_ports': lambda x: int(x) if x.isdigit() else 1,
            'source_port': 'source_port', 'model': 'model', 'description': 'description',
            'usage': 'usage'
        },
        'connections': {
            # For connections, we need to map to existing PC/Switch/PatchPanel IDs
            # This mapping assumes 'pc_name', 'switch_name', 'patch_panel_name' etc. in CSV
            # and will try to look up their IDs. This is crucial for import consistency.
            # Example: 'pc_name' -> pc_id lookup
        }
    }

    if entity_type not in field_maps:
        return jsonify({'error': 'Invalid entity type for import.'}), 400

    try:
        if entity_type == 'locations':
            for i, row_data in enumerate(reader):
                if not row_data: continue
                row_dict = dict(zip(header, row_data))
                
                name = row_dict.get('name')
                if not name:
                    errors.append(f"Row {i+2}: Missing 'name' field. Skipped.")
                    error_count += 1
                    continue

                existing_location = Location.query.filter_by(name=name).first()
                if existing_location:
                    errors.append(f"Row {i+2}: Location '{name}' already exists. Skipped.")
                    error_count += 1
                    continue
                
                new_item = Location(
                    name=name,
                    door_number=row_dict.get('door_number')
                )
                db.session.add(new_item)
                success_count += 1
            db.session.commit()

        elif entity_type == 'racks':
            for i, row_data in enumerate(reader):
                if not row_data: continue
                row_dict = dict(zip(header, row_data))

                name = row_dict.get('name')
                location_name = row_dict.get('location_name')

                if not name or not location_name:
                    errors.append(f"Row {i+2}: Missing 'name' or 'location_name' field. Skipped.")
                    error_count += 1
                    continue
                
                location = Location.query.filter_by(name=location_name).first()
                if not location:
                    errors.append(f"Row {i+2}: Location '{location_name}' not found for Rack '{name}'. Skipped.")
                    error_count += 1
                    continue

                existing_rack = Rack.query.filter_by(name=name).first()
                if existing_rack:
                    errors.append(f"Row {i+2}: Rack '{name}' already exists. Skipped.")
                    error_count += 1
                    continue

                new_item_data = {
                    'name': name,
                    'location_id': location.id,
                    'description': row_dict.get('description'),
                    'total_units': field_maps['racks']['total_units'](row_dict.get('total_units')), # NEW: import total_units
                }
                new_rack = Rack(**new_item_data)
                db.session.add(new_rack)
                success_count += 1
            db.session.commit()

        elif entity_type == 'pcs':
            for i, row_data in enumerate(reader):
                if not row_data: continue
                row_dict = dict(zip(header, row_data))
                
                name = row_dict.get('name')
                if not name:
                    errors.append(f"Row {i+2}: Missing 'name' field. Skipped.")
                    error_count += 1
                    continue

                existing_pc = PC.query.filter_by(name=name).first()
                if existing_pc:
                    # If PC exists, update it. This allows re-importing updated PC data.
                    existing_pc.ip_address = row_dict.get('ip_address', existing_pc.ip_address)
                    existing_pc.username = row_dict.get('username', existing_pc.username)
                    existing_pc.in_domain = row_dict.get('in_domain', str(existing_pc.in_domain)).lower() == 'true'
                    existing_pc.operating_system = row_dict.get('operating_system', existing_pc.operating_system)
                    existing_pc.model = row_dict.get('model', existing_pc.model)
                    existing_pc.office = row_dict.get('office', existing_pc.office)
                    existing_pc.description = row_dict.get('description', existing_pc.description)
                    existing_pc.multi_port = row_dict.get('multi_port', str(existing_pc.multi_port)).lower() == 'true'
                    existing_pc.type = row_dict.get('type', existing_pc.type)
                    existing_pc.usage = row_dict.get('usage', existing_pc.usage)
                    success_count += 1 # Count as success for update
                    continue # Skip to next row

                new_item_data = {}
                for csv_header, model_attr in field_maps['pcs'].items():
                    val = row_dict.get(csv_header)
                    if val is not None:
                        new_item_data[model_attr if isinstance(model_attr, str) else csv_header] = model_attr(val) if callable(model_attr) else val
                
                new_pc = PC(**new_item_data)
                db.session.add(new_pc)
                success_count += 1
            db.session.commit()

        elif entity_type == 'patch_panels':
            for i, row_data in enumerate(reader):
                if not row_data: continue
                row_dict = dict(zip(header, row_data))
                
                name = row_dict.get('name')
                location_name = row_dict.get('location_name')
                rack_name = row_dict.get('rack_name') # Get rack_name from CSV

                if not name or not location_name:
                    errors.append(f"Row {i+2}: Missing 'name' or 'location_name' field. Skipped.")
                    error_count += 1
                    continue

                location = Location.query.filter_by(name=location_name).first()
                if not location:
                    errors.append(f"Row {i+2}: Location '{location_name}' not found for Patch Panel '{name}'. Skipped.")
                    error_count += 1
                    continue

                rack_id = None
                if rack_name:
                    rack = Rack.query.filter_by(name=rack_name).first()
                    if not rack:
                        errors.append(f"Row {i+2}: Rack '{rack_name}' not found for Patch Panel '{name}'. Linking to Rack skipped.")
                    else:
                        rack_id = rack.id

                existing_pp = PatchPanel.query.filter_by(name=name).first()
                if existing_pp:
                    errors.append(f"Row {i+2}: Patch Panel '{name}' already exists. Skipped.")
                    error_count += 1
                    continue
                
                new_item_data = {
                    'name': name,
                    'location_id': location.id,
                    'rack_id': rack_id, # Assign resolved rack_id
                    'row_in_rack': row_dict.get('row_in_rack'),
                    'total_ports': int(row_dict.get('total_ports', 1)) if str(row_dict.get('total_ports', 1)).isdigit() else 1,
                    'description': row_dict.get('description')
                }
                new_pp = PatchPanel(**new_item_data)
                db.session.add(new_pp)
                success_count += 1
            db.session.commit()

        elif entity_type == 'switches':
            for i, row_data in enumerate(reader):
                if not row_data: continue
                row_dict = dict(zip(header, row_data))
                
                name = row_dict.get('name')
                location_name = row_dict.get('location_name')
                rack_name = row_dict.get('rack_name') # Get rack_name from CSV

                if not name or not location_name:
                    errors.append(f"Row {i+2}: Missing 'name' or 'location_name' field. Skipped.")
                    error_count += 1
                    continue

                location = Location.query.filter_by(name=location_name).first()
                if not location:
                    errors.append(f"Row {i+2}: Location '{location_name}' not found for Switch '{name}'. Skipped.")
                    error_count += 1
                    continue

                rack_id = None
                if rack_name:
                    rack = Rack.query.filter_by(name=rack_name).first()
                    if not rack:
                        errors.append(f"Row {i+2}: Rack '{rack_name}' not found for Switch '{name}'. Linking to Rack skipped.")
                    else:
                        rack_id = rack.id

                existing_switch = Switch.query.filter_by(name=name).first()
                if existing_switch:
                    errors.append(f"Row {i+2}: Switch '{name}' already exists. Skipped.")
                    error_count += 1
                    continue
                
                new_item_data = {
                    'name': name,
                    'ip_address': row_dict.get('ip_address'),
                    'location_id': location.id,
                    'rack_id': rack_id, # Assign resolved rack_id
                    'row_in_rack': row_dict.get('row_in_rack'),
                    'total_ports': int(row_dict.get('total_ports', 1)) if str(row_dict.get('total_ports', 1)).isdigit() else 1,
                    'source_port': row_dict.get('source_port'),
                    'model': row_dict.get('model'),
                    'description': row_dict.get('description'),
                    'usage': row_dict.get('usage')
                }
                new_switch = Switch(**new_item_data)
                db.session.add(new_switch)
                success_count += 1
            db.session.commit()

        elif entity_type == 'connections':
            for i, row_data in enumerate(reader):
                if not row_data: continue
                row_dict = dict(zip(header, row_data))

                pc_name = row_dict.get('pc_name')
                switch_name = row_dict.get('switch_name')
                switch_port = row_dict.get('switch_port')
                is_switch_port_up = row_dict.get('is_switch_port_up', 'True').lower() == 'true'
                cable_color = row_dict.get('cable_color')
                cable_label = row_dict.get('cable_label')


                if not pc_name or not switch_name or not switch_port:
                    errors.append(f"Row {i+2}: Missing 'pc_name', 'switch_name', or 'switch_port'. Skipped.")
                    error_count += 1
                    continue

                pc = PC.query.filter_by(name=pc_name).first()
                _switch = Switch.query.filter_by(name=switch_name).first()

                if not pc:
                    errors.append(f"Row {i+2}: PC '{pc_name}' not found. Skipped connection.")
                    error_count += 1
                    continue
                if not _switch:
                    errors.append(f"Row {i+2}: Switch '{switch_name}' not found. Skipped connection.")
                    error_count += 1
                    continue
                
                # Check for existing connection with same PC, Switch, and Switch Port
                existing_connection = Connection.query.filter_by(
                    pc_id=pc.id,
                    switch_id=_switch.id,
                    switch_port=switch_port
                ).first()

                if existing_connection:
                    errors.append(f"Row {i+2}: Connection between PC '{pc_name}', Switch '{switch_name}' port '{switch_port}' already exists. Skipped.")
                    error_count += 1
                    continue

                new_connection = Connection(
                    pc_id=pc.id,
                    switch_id=_switch.id,
                    switch_port=switch_port,
                    is_switch_port_up=is_switch_port_up,
                    cable_color=cable_color,
                    cable_label=cable_label
                )
                db.session.add(new_connection)
                db.session.flush() # Get the new connection's ID before processing hops

                # Process hops dynamically from CSV
                hops_to_add = []
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
                        patch_panel = PatchPanel.query.filter_by(name=pp_name).first()
                        if not patch_panel:
                            errors.append(f"Row {i+2}, Hop {j+1}: Patch Panel '{pp_name}' not found. Skipping this hop.")
                            continue
                        hops_to_add.append(ConnectionHop(
                            connection_id=new_connection.id,
                            patch_panel_id=patch_panel.id,
                            patch_panel_port=pp_port,
                            is_port_up=is_hop_port_up,
                            sequence=j,
                            cable_color=hop_cable_color,
                            cable_label=hop_cable_label
                        ))
                
                for hop in hops_to_add:
                    db.session.add(hop)
                
                success_count += 1
            db.session.commit()

        else:
            db.session.rollback()
            return jsonify({'error': 'Invalid entity type for import.'}), 400

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

if __name__ == '__main__':
    # Ensure the instance directory exists for SQLite database
    instance_path = os.path.join(app.root_path, 'instance')
    os.makedirs(instance_path, exist_ok=True)
    # The 'flask db upgrade' command in docker-compose handles initial migration
    # and database creation.
    app.run(debug=True, host='0.0.0.0')