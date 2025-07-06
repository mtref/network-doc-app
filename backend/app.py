# backend/app.py
# This is the main Flask application for the network documentation backend.
# It defines the database models, API endpoints, and handles CRUD operations.

import io
import csv
from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS # For handling Cross-Origin Resource Sharing
from sqlalchemy.orm import joinedload # To eager load related data
from werkzeug.utils import secure_filename # For secure filenames

import os
import uuid # For unique filenames

# --- Debugging Start ---
print("--- app.py: Starting Flask app initialization ---")
# --- Debugging End ---

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Debugging Start ---
print("--- app.py: CORS initialized ---")
# --- Debugging End ---

# Database configuration
# Using SQLite for simplicity. The database file will be stored in the 'instance' folder.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///network_doc.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuration for PDF uploads
# Define these as global constants first, then assign to app.config
UPLOAD_FOLDER_PATH = os.path.join(app.root_path, 'uploads/pdf_templates')
ALLOWED_EXTENSIONS_SET = {'pdf'} # Changed name to avoid conflict with function
MAX_PDF_FILES_LIMIT = 5 # Changed name for clarity as it's a limit

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER_PATH
app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS_SET # Corrected variable name here
app.config['MAX_PDF_FILES'] = MAX_PDF_FILES_LIMIT

# --- Debugging Start ---
print(f"--- app.py: App config set. UPLOAD_FOLDER: {app.config['UPLOAD_FOLDER']}, MAX_PDF_FILES: {app.config['MAX_PDF_FILES']} ---")
# --- Debugging End ---

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True) # Use app.config for consistency

# --- Debugging Start ---
print(f"--- app.py: Upload folder checked/created: {app.config['UPLOAD_FOLDER']} ---")
# --- Debugging End ---

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# --- Debugging Start ---
print("--- app.py: SQLAlchemy and Migrate initialized ---")
# --- Debugging End ---

# --- Global Constants ---
MAX_HOPS = 5 # Maximum number of hops to export/import for connections

# --- Database Models ---
# Define the structure of your data tables.

class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    door_number = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'door_number': self.door_number
        }
# --- Debugging Start ---
print("--- app.py: Location model defined ---")
# --- Debugging End ---

class Rack(db.Model):
    __tablename__ = 'racks'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    location = db.relationship('Location', backref='racks_in_location', lazy=True)
    description = db.Column(db.String(255), nullable=True)
    total_units = db.Column(db.Integer, nullable=False, default=42)
    orientation = db.Column(db.String(50), nullable=False, default='bottom-up')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'location': self.location.to_dict() if self.location else None,
            'description': self.description,
            'total_units': self.total_units,
            'orientation': self.orientation,
        }
# --- Debugging Start ---
print("--- app.py: Rack model defined ---")
# --- Debugging End ---

class PC(db.Model):
    __tablename__ = 'pcs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100), nullable=True)
    username = db.Column(db.String(100), nullable=True)
    in_domain = db.Column(db.Boolean, nullable=False, default=False)
    operating_system = db.Column(db.String(100), nullable=True)
    model = db.Column(db.String(255), nullable=True)
    office = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(255), nullable=True)
    multi_port = db.Column(db.Boolean, nullable=False, default=False)
    type = db.Column(db.String(50), nullable=False, default='Workstation')
    usage = db.Column(db.String(100), nullable=True)
    # NEW: Fields for linking to Rack for 'Server' type PCs
    row_in_rack = db.Column(db.String(50), nullable=True)
    rack_name = db.Column(db.String(100), nullable=True) # Denormalized for easier access
    rack_id = db.Column(db.Integer, db.ForeignKey('racks.id'), nullable=True)
    rack = db.relationship('Rack', backref='pcs_in_rack', lazy=True)


    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'username': self.username,
            'in_domain': self.in_domain,
            'operating_system': self.operating_system,
            'model': self.model,
            'office': self.office,
            'description': self.description,
            'multi_port': self.multi_port,
            'type': self.type,
            'usage': self.usage,
            'row_in_rack': self.row_in_rack, # NEW
            'rack_id': self.rack_id, # NEW
            'rack_name': self.rack.name if self.rack else None, # NEW
            'rack': self.rack.to_dict() if self.rack else None, # NEW
        }
# --- Debugging Start ---
print("--- app.py: PC model defined ---")
# --- Debugging End ---

class PatchPanel(db.Model):
    __tablename__ = 'patch_panels'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    location = db.relationship('Location', backref='patch_panels_in_location', lazy=True)
    row_in_rack = db.Column(db.String(50), nullable=True)
    rack_name = db.Column(db.String(100), nullable=True)
    rack_id = db.Column(db.Integer, db.ForeignKey('racks.id'), nullable=True)
    rack = db.relationship('Rack', backref='patch_panels_in_rack', lazy=True)
    total_ports = db.Column(db.Integer, nullable=False, default=1)
    description = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'row_in_rack': self.row_in_rack,
            'rack_id': self.rack_id,
            'rack_name': self.rack.name if self.rack else None,
            'total_ports': self.total_ports,
            'description': self.description,
            'location': self.location.to_dict() if self.location else None,
            'rack': self.rack.to_dict() if self.rack else None,
        }
# --- Debugging Start ---
print("--- app.py: PatchPanel model defined ---")
# --- Debugging End ---

class Switch(db.Model):
    __tablename__ = 'switches'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100), nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    location = db.relationship('Location', backref='switches_in_location', lazy=True)
    row_in_rack = db.Column(db.String(50), nullable=True)
    rack_name = db.Column(db.String(100), nullable=True)
    rack_id = db.Column(db.Integer, db.ForeignKey('racks.id'), nullable=True)
    rack = db.relationship('Rack', backref='switches_in_rack', lazy=True)
    total_ports = db.Column(db.Integer, nullable=False, default=1)
    source_port = db.Column(db.String(100), nullable=True)
    model = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(255), nullable=True)
    usage = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'row_in_rack': self.row_in_rack,
            'rack_id': self.rack_id,
            'rack_name': self.rack.name if self.rack else None,
            'total_ports': self.total_ports,
            'source_port': self.source_port,
            'model': self.model,
            'description': self.description,
            'usage': self.usage,
            'location': self.location.to_dict() if self.location else None,
            'rack': self.rack.to_dict() if self.rack else None,
        }
# --- Debugging Start ---
print("--- app.py: Switch model defined ---")
# --- Debugging End ---

class Connection(db.Model):
    __tablename__ = 'connections'
    id = db.Column(db.Integer, primary_key=True)
    pc_id = db.Column(db.Integer, db.ForeignKey('pcs.id'), nullable=False)
    switch_id = db.Column(db.Integer, db.ForeignKey('switches.id'), nullable=False)
    switch_port = db.Column(db.String(50), nullable=False)
    is_switch_port_up = db.Column(db.Boolean, nullable=False, default=True)
    cable_color = db.Column(db.String(50), nullable=True)
    cable_label = db.Column(db.String(100), nullable=True)

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
            'cable_color': self.cable_color,
            'cable_label': self.cable_label
        }
# --- Debugging Start ---
print("--- app.py: Connection model defined ---")
# --- Debugging End ---

class ConnectionHop(db.Model):
    __tablename__ = 'connection_hops'
    id = db.Column(db.Integer, primary_key=True)
    connection_id = db.Column(db.Integer, db.ForeignKey('connections.id'), nullable=False)
    patch_panel_id = db.Column(db.Integer, db.ForeignKey('patch_panels.id'), nullable=False)
    patch_panel_port = db.Column(db.String(50), nullable=False)
    is_port_up = db.Column(db.Boolean, nullable=False, default=True)
    sequence = db.Column(db.Integer, nullable=False)
    cable_color = db.Column(db.String(50), nullable=True)
    cable_label = db.Column(db.String(100), nullable=True)

    patch_panel = db.relationship('PatchPanel', backref='connection_hops', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'patch_panel': self.patch_panel.to_dict() if self.patch_panel else None,
            'patch_panel_port': self.patch_panel_port,
            'is_port_up': self.is_port_up,
            'sequence': self.sequence,
            'cable_color': self.cable_color,
            'cable_label': self.cable_label
        }
# --- Debugging Start ---
print("--- app.py: ConnectionHop model defined ---")
# --- Debugging End ---

# NEW: Model for PDF templates
class PdfTemplate(db.Model):
    __tablename__ = 'pdf_templates'
    id = db.Column(db.Integer, primary_key=True)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), unique=True, nullable=False)
    upload_date = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

    def to_dict(self):
        return {
            'id': self.id,
            'original_filename': self.original_filename,
            'stored_filename': self.stored_filename,
            'upload_date': self.upload_date.isoformat()
        }
# --- Debugging Start ---
print("--- app.py: PdfTemplate model defined ---")
# --- Debugging End ---

# NEW: Model for Application Settings
class AppSettings(db.Model):
    __tablename__ = 'app_settings'
    id = db.Column(db.Integer, primary_key=True)
    default_pdf_id = db.Column(db.Integer, db.ForeignKey('pdf_templates.id'), nullable=True)
    default_pdf = db.relationship('PdfTemplate', backref='app_settings', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'default_pdf_id': self.default_pdf_id,
            'default_pdf_name': self.default_pdf.original_filename if self.default_pdf else None
        }
# --- Debugging Start ---
print("--- app.py: AppSettings model defined ---")
# --- Debugging End ---

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

# NEW HELPER FUNCTION: Validate Rack Unit Occupancy
def validate_rack_unit_occupancy(rack_id, row_in_rack, device_type, exclude_device_id=None):
    """
    Checks if a specific row in a rack is already occupied by another device.
    Returns (True, conflicting_device_name) if occupied, (False, None) if available.
    """
    if not rack_id or not row_in_rack:
        return False, None # No rack or row specified, so no conflict check needed

    # Check Switches
    switches_in_row = Switch.query.filter_by(
        rack_id=rack_id,
        row_in_rack=row_in_rack
    )
    if device_type == 'switch' and exclude_device_id:
        switches_in_row = switches_in_row.filter(Switch.id != exclude_device_id)
    
    conflicting_switch = switches_in_row.first()
    if conflicting_switch:
        return True, f"Switch '{conflicting_switch.name}'"

    # Check Patch Panels
    patch_panels_in_row = PatchPanel.query.filter_by(
        rack_id=rack_id,
        row_in_rack=row_in_rack
    )
    if device_type == 'patch_panel' and exclude_device_id:
        patch_panels_in_row = patch_panels_in_row.filter(PatchPanel.id != exclude_device_id)
    
    conflicting_pp = patch_panels_in_row.first()
    if conflicting_pp:
        return True, f"Patch Panel '{conflicting_pp.name}'"

    # NEW: Check PCs (of type 'Server')
    pcs_in_row = PC.query.filter_by(
        rack_id=rack_id,
        row_in_rack=row_in_rack,
        type='Server' # Only servers occupy rack space
    )
    if device_type == 'pc' and exclude_device_id:
        pcs_in_row = pcs_in_row.filter(PC.id != exclude_device_id)
    
    conflicting_pc = pcs_in_row.first()
    if conflicting_pc:
        return True, f"PC '{conflicting_pc.name}' (Server)"

    return False, None

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Location Endpoints
@app.route('/locations', methods=['GET', 'POST'])
def handle_locations():
    # --- Debugging Start ---
    print("--- app.py: Registering /locations endpoint ---")
    # --- Debugging End ---
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Location name is required'}), 400
        new_location = Location(
            name=data['name'],
            door_number=data.get('door_number')
        )
        try:
            db.session.add(new_location)
            db.session.commit()
            return jsonify(new_location.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
        locations = Location.query.all()
        return jsonify([location.to_dict() for location in locations])

@app.route('/locations/<int:location_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_location_by_id(location_id):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /locations/{location_id} endpoint ---")
    # --- Debugging End ---
    location = Location.query.get_or_404(location_id)
    if request.method == 'GET':
        return jsonify(location.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Location name is required'}), 400
        location.name = data.get('name', location.name)
        location.door_number = data.get('door_number', location.door_number)
        try:
            db.session.commit()
            return jsonify(location.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
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
    # --- Debugging Start ---
    print("--- app.py: Registering /racks endpoint ---")
    # --- Debugging End ---
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name') or not data.get('location_id'):
            return jsonify({'error': 'Rack name and location_id are required'}), 400
        total_units = data.get('total_units', 42)
        try:
            total_units = int(total_units)
            if not (1 <= total_units <= 50):
                return jsonify({'error': 'Total units must be an integer between 1 and 50.'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Total units must be a valid integer.'}), 400

        new_rack = Rack(
            name=data['name'],
            location_id=data['location_id'],
            description=data.get('description'),
            total_units=total_units,
            orientation=data.get('orientation', 'bottom-up')
        )
        try:
            db.session.add(new_rack)
            db.session.commit()
            db.session.refresh(new_rack)
            return jsonify(new_rack.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
        racks = Rack.query.options(joinedload(Rack.location)).all()
        return jsonify([rack.to_dict() for rack in racks])

@app.route('/racks/<int:rack_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_rack_by_id(rack_id):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /racks/{rack_id} endpoint ---")
    # --- Debugging End ---
    rack = Rack.query.options(joinedload(Rack.location)).get_or_404(rack_id)
    if request.method == 'GET':
        return jsonify(rack.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data or not data.get('name') or not data.get('location_id'):
            return jsonify({'error': 'Rack name and location_id are required'}), 400
        
        if 'total_units' in data:
            total_units = data.get('total_units')
            try:
                total_units = int(total_units)
                if not (1 <= total_units <= 50):
                    return jsonify({'error': 'Total units must be an integer between 1 and 50.'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Total units must be a valid integer.'}), 400
            rack.total_units = total_units
        
        rack.name = data.get('name', rack.name)
        rack.location_id = data.get('location_id', rack.location_id)
        rack.description = data.get('description', rack.description)
        rack.orientation = data.get('orientation', rack.orientation)
        try:
            db.session.commit()
            db.session.refresh(rack)
            return jsonify(rack.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
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
    # --- Debugging Start ---
    print("--- app.py: Registering /pcs endpoint ---")
    # --- Debugging End ---
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'PC name is required'}), 400

        pc_type = data.get('type', 'Workstation')
        rack_id = data.get('rack_id')
        row_in_rack = data.get('row_in_rack')

        if pc_type == 'Server' and rack_id and row_in_rack:
            is_occupied, conflicting_device = validate_rack_unit_occupancy(
                rack_id=rack_id,
                row_in_rack=row_in_rack,
                device_type='pc'
            )
            if is_occupied:
                return jsonify({'error': f"Rack unit '{row_in_rack}' in Rack ID '{rack_id}' is already occupied by {conflicting_device}."}), 409
        
        # If PC type is not 'Server', ensure rack_id and row_in_rack are null
        if pc_type != 'Server':
            rack_id = None
            row_in_rack = None

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
            row_in_rack=row_in_rack, # NEW
            rack_id=rack_id, # NEW
        )
        try:
            db.session.add(new_pc)
            db.session.commit()
            db.session.refresh(new_pc) # Refresh to load relationship data (e.g., rack.name)
            return jsonify(new_pc.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
        pcs = PC.query.options(joinedload(PC.rack)).all() # Eager load rack for PC
        return jsonify([pc.to_dict() for pc in pcs])

@app.route('/pcs/<int:pc_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_pc_by_id(pc_id):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /pcs/{pc_id} endpoint ---")
    # --- Debugging End ---
    pc = PC.query.options(joinedload(PC.rack)).get_or_404(pc_id) # Eager load rack for PC
    if request.method == 'GET':
        return jsonify(pc.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400
        
        pc_type = data.get('type', pc.type) # Get new type or keep old
        rack_id = data.get('rack_id', pc.rack_id)
        row_in_rack = data.get('row_in_rack', pc.row_in_rack)

        # Validate rack occupancy only if type is 'Server' and rack/row are provided/changed
        if pc_type == 'Server' and rack_id and row_in_rack:
            # Only validate if rack_id or row_in_rack has actually changed
            if str(rack_id) != str(pc.rack_id) or str(row_in_rack) != str(pc.row_in_rack):
                is_occupied, conflicting_device = validate_rack_unit_occupancy(
                    rack_id=rack_id,
                    row_in_rack=row_in_rack,
                    device_type='pc',
                    exclude_device_id=pc_id
                )
                if is_occupied:
                    return jsonify({'error': f"Rack unit '{row_in_rack}' in Rack ID '{rack_id}' is already occupied by {conflicting_device}."}), 409
        
        # If PC type changes from 'Server' to 'Workstation', clear rack details
        if pc_type != 'Server':
            rack_id = None
            row_in_rack = None
        
        pc.name = data.get('name', pc.name)
        pc.ip_address = data.get('ip_address', pc.ip_address)
        pc.username = data.get('username', pc.username)
        pc.in_domain = data.get('in_domain', pc.in_domain)
        pc.operating_system = data.get('operating_system', pc.operating_system)
        pc.model = data.get('model', pc.model)
        pc.office = data.get('office', pc.office)
        pc.description = data.get('description', pc.description)
        pc.multi_port = data.get('multi_port', pc.multi_port)
        pc.type = pc_type # NEW
        pc.usage = data.get('usage', pc.usage)
        pc.row_in_rack = row_in_rack # NEW
        pc.rack_id = rack_id # NEW

        try:
            db.session.commit()
            db.session.refresh(pc) # Refresh to load relationship data (e.g., rack.name)
            return jsonify(pc.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
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
    # --- Debugging Start ---
    print("--- app.py: Registering /available_pcs endpoint ---")
    # --- Debugging End ---
    all_pcs = PC.query.all()
    all_connections = Connection.query.options(joinedload(Connection.pc)).all()

    connected_single_port_pc_ids = {conn.pc_id for conn in all_connections if conn.pc and not conn.pc.multi_port}

    available_pcs = []
    for pc in all_pcs:
        if pc.multi_port or pc.id not in connected_single_port_pc_ids:
            available_pcs.append(pc.to_dict())
            
    return jsonify(available_pcs)


# Patch Panel Endpoints (updated to handle new fields)
@app.route('/patch_panels', methods=['GET', 'POST'])
def handle_patch_panels():
    # --- Debugging Start ---
    print("--- app.py: Registering /patch_panels endpoint ---")
    # --- Debugging End ---
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Patch Panel name is required'}), 400
        
        rack_id = data.get('rack_id')
        row_in_rack = data.get('row_in_rack')
        if rack_id and row_in_rack:
            is_occupied, conflicting_device = validate_rack_unit_occupancy(
                rack_id=rack_id,
                row_in_rack=row_in_rack,
                device_type='patch_panel'
            )
            if is_occupied:
                return jsonify({'error': f"Rack unit '{row_in_rack}' in Rack ID '{rack_id}' is already occupied by {conflicting_device}."}), 409

        total_ports = int(data.get('total_ports', 1)) if str(data.get('total_ports', 1)).isdigit() else 1
        new_pp = PatchPanel(
            name=data['name'],
            location_id=data.get('location_id'),
            row_in_rack=row_in_rack,
            rack_id=rack_id,
            total_ports=total_ports,
            description=data.get('description')
        )
        try:
            db.session.add(new_pp)
            db.session.commit()
            db.session.refresh(new_pp)
            return jsonify(new_pp.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
        patch_panels = PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).all()
        return jsonify([pp.to_dict() for pp in patch_panels])

@app.route('/patch_panels/<int:pp_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_patch_panel_by_id(pp_id):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /patch_panels/{pp_id} endpoint ---")
    # --- Debugging End ---
    pp = PatchPanel.query.options(joinedload(PatchPanel.location), joinedload(PatchPanel.rack)).get_or_404(pp_id)
    if request.method == 'GET':
        return jsonify(pp.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400
        
        rack_id = data.get('rack_id', pp.rack_id)
        row_in_rack = data.get('row_in_rack', pp.row_in_rack)
        if rack_id and row_in_rack and (str(rack_id) != str(pp.rack_id) or str(row_in_rack) != str(pp.row_in_rack)):
             is_occupied, conflicting_device = validate_rack_unit_occupancy(
                rack_id=rack_id,
                row_in_rack=row_in_rack,
                device_type='patch_panel',
                exclude_device_id=pp_id
            )
             if is_occupied:
                 return jsonify({'error': f"Rack unit '{row_in_rack}' in Rack ID '{rack_id}' is already occupied by {conflicting_device}."}), 409

        pp.name = data.get('name', pp.name)
        pp.location_id = data.get('location_id', pp.location_id)
        pp.row_in_rack = row_in_rack
        pp.rack_id = rack_id
        pp.total_ports = int(data.get('total_ports', pp.total_ports)) if str(data.get('total_ports', pp.total_ports)).isdigit() else pp.total_ports
        pp.description = data.get('description', pp.description)
        try:
            db.session.commit()
            db.session.refresh(pp)
            return jsonify(pp.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
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
    # --- Debugging Start ---
    print("--- app.py: Registering /switches endpoint ---")
    # --- Debugging End ---
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Switch name is required'}), 400

        rack_id = data.get('rack_id')
        row_in_rack = data.get('row_in_rack')
        if rack_id and row_in_rack:
            is_occupied, conflicting_device = validate_rack_unit_occupancy(
                rack_id=rack_id,
                row_in_rack=row_in_rack,
                device_type='switch'
            )
            if is_occupied:
                return jsonify({'error': f"Rack unit '{row_in_rack}' in Rack ID '{rack_id}' is already occupied by {conflicting_device}."}), 409

        total_ports = int(data.get('total_ports', 1)) if str(data.get('total_ports', 1)).isdigit() else 1
        new_switch = Switch(
            name=data['name'],
            ip_address=data.get('ip_address'),
            location_id=data.get('location_id'),
            row_in_rack=row_in_rack,
            rack_id=rack_id,
            total_ports=total_ports,
            source_port=data.get('source_port'),
            model=data.get('model'),
            description=data.get('description'),
            usage=data.get('usage')
        )
        try:
            db.session.add(new_switch)
            db.session.commit()
            db.session.refresh(new_switch)
            return jsonify(new_switch.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
        switches = Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).all()
        return jsonify([_switch.to_dict() for _switch in switches])

@app.route('/switches/<int:switch_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_switch_by_id(switch_id):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /switches/{switch_id} endpoint ---")
    # --- Debugging End ---
    _switch = Switch.query.options(joinedload(Switch.location), joinedload(Switch.rack)).get_or_404(switch_id)
    if request.method == 'GET':
        return jsonify(_switch.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400
        
        rack_id = data.get('rack_id', _switch.rack_id)
        row_in_rack = data.get('row_in_rack', _switch.row_in_rack)
        if rack_id and row_in_rack and (str(rack_id) != str(_switch.rack_id) or str(row_in_rack) != str(_switch.row_in_rack)):
             is_occupied, conflicting_device = validate_rack_unit_occupancy(
                rack_id=rack_id,
                row_in_rack=row_in_rack,
                device_type='switch',
                exclude_device_id=switch_id
            )
             if is_occupied:
                 return jsonify({'error': f"Rack unit '{row_in_rack}' in Rack ID '{rack_id}' is already occupied by {conflicting_device}."}), 409

        _switch.name = data.get('name', _switch.name)
        _switch.ip_address = data.get('ip_address', _switch.ip_address)
        _switch.location_id = data.get('location_id', _switch.location_id)
        _switch.row_in_rack = row_in_rack
        _switch.rack_id = rack_id
        _switch.total_ports = int(data.get('total_ports', _switch.total_ports)) if str(data.get('total_ports', _switch.total_ports)).isdigit() else _switch.total_ports
        _switch.source_port = data.get('source_port', _switch.source_port)
        _switch.model = data.get('model', _switch.model)
        _switch.description = data.get('description', _switch.description)
        _switch.usage = data.get('usage', _switch.usage)
        try:
            db.session.commit()
            db.session.refresh(_switch)
            return jsonify(_switch.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else:
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
    # --- Debugging Start ---
    print("--- app.py: Registering /connections endpoint ---")
    # --- Debugging End ---
    if request.method == 'POST':
        data = request.json
        required_fields = ['pc_id', 'switch_id', 'switch_port', 'is_switch_port_up', 'hops']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields for connection'}), 400

        pc = PC.query.get(data['pc_id'])
        if pc and not pc.multi_port:
            existing_connection_for_pc = Connection.query.filter_by(pc_id=pc.id).first()
            if existing_connection_for_pc:
                return jsonify({'error': f"PC '{pc.name}' is a single-port device and is already connected. Cannot create new connection."}), 409

        is_occupied, conflicting_pc = validate_port_occupancy(
            target_id=data['switch_id'],
            port_number=data['switch_port'],
            entity_type='switch'
        )
        if is_occupied:
            return jsonify({'error': f'Switch port {data["switch_port"]} is already in use by PC: {conflicting_pc}'}), 409

        new_connection = Connection(
            pc_id=data['pc_id'],
            switch_id=data['switch_id'],
            switch_port=data['switch_port'],
            is_switch_port_up=data['is_switch_port_up'],
            cable_color=data.get('cable_color'),
            cable_label=data.get('cable_label')
        )
        db.session.add(new_connection)
        db.session.flush()

        for idx, hop_data in enumerate(data['hops']):
            if not all(f in hop_data for f in ['patch_panel_id', 'patch_panel_port', 'is_port_up']):
                db.session.rollback()
                return jsonify({'error': f'Missing fields for hop {idx}'}), 400

            is_occupied, conflicting_pc = validate_port_occupancy(
                target_id=hop_data['patch_panel_id'],
                port_number=hop_data['patch_panel_port'],
                entity_type='patch_panel',
                exclude_connection_id=new_connection.id # Exclude current connection being added
            )
            if is_occupied:
                db.session.rollback()
                return jsonify({'error': f'Patch Panel port {hop_data["patch_panel_port"]} on Patch Panel ID {hop_data["patch_panel_id"]} is already in use by PC: {conflicting_pc}'}), 409

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

        try:
            db.session.commit()
            db.session.refresh(new_connection)
            return jsonify(new_connection.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        connections = Connection.query.options(
            joinedload(Connection.pc).joinedload(PC.rack), # Eager load PC's rack
            joinedload(Connection.switch).joinedload(Switch.location),
            joinedload(Connection.switch).joinedload(Switch.rack),
            joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.location),
            joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel).joinedload(PatchPanel.rack)
        ).all()
        return jsonify([conn.to_dict() for conn in connections])

@app.route('/connections/<int:conn_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_connection_by_id(conn_id):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /connections/{conn_id} endpoint ---")
    # --- Debugging End ---
    connection = Connection.query.options(
        joinedload(Connection.pc).joinedload(PC.rack), # Eager load PC's rack
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

        new_pc_id = data.get('pc_id', connection.pc_id)
        if new_pc_id != connection.pc_id:
            new_pc = PC.query.get(new_pc_id)
            if new_pc and not new_pc.multi_port:
                existing_connection_for_new_pc = Connection.query.filter(
                    Connection.pc_id == new_pc.id,
                    Connection.id != conn_id
                ).first()
                if existing_connection_for_new_pc:
                    return jsonify({'error': f"PC '{new_pc.name}' is a single-port device and is already connected in another connection. Cannot update."}), 409

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
        connection.cable_color = data.get('cable_color', connection.cable_color)
        connection.cable_label = data.get('cable_label', connection.cable_label)

        if 'hops' in data:
            for hop in connection.hops:
                db.session.delete(hop)
            db.session.flush()

            for idx, hop_data in enumerate(data['hops']):
                if not all(f in hop_data for f in ['patch_panel_id', 'patch_panel_port', 'is_port_up']):
                    db.session.rollback()
                    return jsonify({'error': f'Missing fields for hop {idx}'}), 400

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
                    cable_color=hop_data.get('cable_color'),
                    cable_label=hop_data.get('cable_label')
                )
                db.session.add(new_hop)

        try:
            db.session.commit()
            db.session.refresh(connection)
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
    # --- Debugging Start ---
    print(f"--- app.py: Registering /patch_panels/{pp_id}/ports endpoint ---")
    # --- Debugging End ---
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
        'row_in_rack': patch_panel.row_in_rack,
        'rack_name': patch_panel.rack.name if patch_panel.rack else None,
        'description': patch_panel.description,
        'total_ports': patch_panel.total_ports,
        'location': patch_panel.location.to_dict() if patch_panel.location else None,
        'rack': patch_panel.rack.to_dict() if patch_panel.rack else None,
        'ports': port_status
    })

@app.route('/switches/<int:switch_id>/ports', methods=['GET'])
def get_switch_ports(switch_id):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /switches/{switch_id}/ports endpoint ---")
    # --- Debugging End ---
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
        'ip_address': _switch.ip_address,
        'row_in_rack': _switch.row_in_rack,
        'rack_name': _switch.rack.name if _switch.rack else None,
        'source_port': _switch.source_port,
        'model': _switch.model,
        'description': _switch.description,
        'total_ports': _switch.total_ports,
        'location': _switch.location.to_dict() if _switch.location else None,
        'rack': _switch.rack.to_dict() if _switch.rack else None,
        'ports': port_status
    })

# --- New CSV Export Endpoints ---

@app.route('/export/<entity_type>', methods=['GET'])
def export_data(entity_type):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /export/{entity_type} endpoint ---")
    # --- Debugging End ---
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
            headers = ['id', 'name', 'location_id', 'location_name', 'location_door_number', 'description', 'total_units', 'orientation']
            racks = Rack.query.options(joinedload(Rack.location)).all()
            data_rows = [[r.id, r.name, r.location_id, r.location.name if r.location else '', r.location.door_number if r.location else '', r.description, r.total_units, r.orientation] for r in racks]
            filename = 'racks.csv'
        elif entity_type == 'pcs':
            # UPDATED: Added new fields for PC export
            headers = ['id', 'name', 'ip_address', 'username', 'in_domain', 'operating_system', 'model', 'office', 'description', 'multi_port', 'type', 'usage', 'row_in_rack', 'rack_id', 'rack_name']
            pcs = PC.query.options(joinedload(PC.rack)).all()
            data_rows = [[pc.id, pc.name, pc.ip_address, pc.username, pc.in_domain, pc.operating_system, pc.model, pc.office, pc.description, pc.multi_port, pc.type, pc.usage, pc.row_in_rack, pc.rack_id, pc.rack.name if pc.rack else ''] for pc in pcs]
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
        return jsonify({'error': f'Failed to export {entity_type} data: {str(e)}', 'details': errors}), 500


# --- New CSV Import Endpoint ---

@app.route('/import/<entity_type>', methods=['POST'])
def import_data(entity_type):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /import/{entity_type} endpoint ---")
    # --- Debugging End ---
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
            'total_units': lambda x: int(x) if x.isdigit() else 42,
            'orientation': lambda x: x if x in ['bottom-up', 'top-down'] else 'bottom-up',
        },
        'pcs': {
            'name': 'name', 'ip_address': 'ip_address', 'username': 'username',
            'in_domain': lambda x: x.lower() == 'true',
            'operating_system': 'operating_system', 'model': 'model',
            'office': 'office', 'description': 'description',
            'multi_port': lambda x: x.lower() == 'true',
            'type': 'type',
            'usage': 'usage',
            'row_in_rack': 'row_in_rack', # NEW
            'rack_name': lambda x: Rack.query.filter_by(name=x).first().id if Rack.query.filter_by(name=x).first() else None, # NEW
        },
        'patch_panels': {
            'name': 'name',
            'location_name': lambda x: Location.query.filter_by(name=x).first().id if Location.query.filter_by(name=x).first() else None,
            'row_in_rack': 'row_in_rack',
            'rack_name': lambda x: Rack.query.filter_by(name=x).first().id if Rack.query.filter_by(name=x).first() else None,
            'total_ports': lambda x: int(x) if x.isdigit() else 1,
            'description': 'description'
        },
        'switches': {
            'name': 'name', 'ip_address': 'ip_address',
            'location_name': lambda x: Location.query.filter_by(name=x).first().id if Location.query.filter_by(name=x).first() else None,
            'row_in_rack': 'row_in_rack',
            'rack_name': lambda x: Rack.query.filter_by(name=x).first().id if Rack.query.filter_by(name=x).first() else None,
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
                    'total_units': field_maps['racks']['total_units'](row_dict.get('total_units')),
                    'orientation': field_maps['racks']['orientation'](row_dict.get('orientation')),
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

                pc_type = row_dict.get('type', 'Workstation') # Default to Workstation
                rack_id = None
                row_in_rack = row_dict.get('row_in_rack')
                rack_name = row_dict.get('rack_name')

                if pc_type == 'Server' and rack_name:
                    rack = Rack.query.filter_by(name=rack_name).first()
                    if not rack:
                        errors.append(f"Row {i+2}: Rack '{rack_name}' not found for PC '{name}'. Rack link skipped.")
                    else:
                        rack_id = rack.id
                        # Validate rack occupancy for new server PCs during import
                        if rack_id and row_in_rack:
                            is_occupied, conflicting_device = validate_rack_unit_occupancy(
                                rack_id=rack_id,
                                row_in_rack=row_in_rack,
                                device_type='pc'
                            )
                            if is_occupied:
                                errors.append(f"Row {i+2}: Rack unit '{row_in_rack}' in Rack '{rack_name}' is already occupied by {conflicting_device}. PC '{name}' skipped.")
                                error_count += 1
                                continue # Skip this PC if rack unit is occupied
                
                # Ensure rack_id and row_in_rack are null if not a Server
                if pc_type != 'Server':
                    rack_id = None
                    row_in_rack = None

                existing_pc = PC.query.filter_by(name=name).first()
                if existing_pc:
                    # If PC exists, update it. This allows re-importing updated PC data.
                    # Before updating, check if the update would cause a rack conflict
                    if pc_type == 'Server' and rack_id and row_in_rack:
                        if (str(rack_id) != str(existing_pc.rack_id) or str(row_in_rack) != str(existing_pc.row_in_rack)):
                            is_occupied, conflicting_device = validate_rack_unit_occupancy(
                                rack_id=rack_id,
                                row_in_rack=row_in_rack,
                                device_type='pc',
                                exclude_device_id=existing_pc.id
                            )
                            if is_occupied:
                                errors.append(f"Row {i+2}: Update for PC '{name}' would conflict with {conflicting_device} in Rack '{rack_name}' unit '{row_in_rack}'. Update skipped.")
                                error_count += 1
                                continue # Skip update if it causes a conflict

                    existing_pc.ip_address = row_dict.get('ip_address', existing_pc.ip_address)
                    existing_pc.username = row_dict.get('username', existing_pc.username)
                    existing_pc.in_domain = row_dict.get('in_domain', str(existing_pc.in_domain)).lower() == 'true'
                    existing_pc.operating_system = row_dict.get('operating_system', existing_pc.operating_system)
                    existing_pc.model = row_dict.get('model', existing_pc.model)
                    existing_pc.office = row_dict.get('office', existing_pc.office)
                    existing_pc.description = row_dict.get('description', existing_pc.description)
                    existing_pc.multi_port = row_dict.get('multi_port', str(existing_pc.multi_port)).lower() == 'true'
                    existing_pc.type = pc_type # NEW
                    existing_pc.usage = row_dict.get('usage', existing_pc.usage) # NEW
                    existing_pc.row_in_rack = row_in_rack # NEW
                    existing_pc.rack_id = rack_id # NEW
                    success_count += 1
                    continue

                new_item_data = {
                    'name': name,
                    'ip_address': row_dict.get('ip_address'),
                    'username': row_dict.get('username'),
                    'in_domain': row_dict.get('in_domain', 'False').lower() == 'true',
                    'operating_system': row_dict.get('operating_system'),
                    'model': row_dict.get('model'),
                    'office': row_dict.get('office'),
                    'description': row_dict.get('description'),
                    'multi_port': row_dict.get('multi_port', 'False').lower() == 'true',
                    'type': pc_type, # NEW
                    'usage': row_dict.get('usage'), # NEW
                    'row_in_rack': row_in_rack, # NEW
                    'rack_id': rack_id, # NEW
                }
                
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
                rack_name = row_dict.get('rack_name')

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
                    'rack_id': rack_id,
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
                rack_name = row_dict.get('rack_name')

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
                    'rack_id': rack_id,
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
                db.session.flush()

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

# NEW PDF TEMPLATE MANAGEMENT ENDPOINTS

@app.route('/pdf_templates', methods=['GET'])
def list_pdf_templates():
    # --- Debugging Start ---
    print("--- app.py: Registering /pdf_templates endpoint ---")
    # --- Debugging End ---
    templates = PdfTemplate.query.all()
    settings = AppSettings.query.get(1)
    default_pdf_id = settings.default_pdf_id if settings else None

    return jsonify({
        'templates': [t.to_dict() for t in templates],
        'default_pdf_id': default_pdf_id
    })


@app.route('/pdf_templates/upload', methods=['POST'])
def upload_pdf_template():
    # --- Debugging Start ---
    print("--- app.py: Registering /pdf_templates/upload endpoint ---")
    # --- Debugging End ---
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if PdfTemplate.query.count() >= app.config['MAX_PDF_FILES']: # Corrected access
        return jsonify({'error': f'Maximum of {app.config["MAX_PDF_FILES"]} PDF templates allowed.'}), 400

    if file and allowed_file(file.filename):
        original_filename = file.filename
        unique_filename = str(uuid.uuid4()) + '.' + original_filename.rsplit('.', 1)[1].lower()
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        try:
            file.save(filepath)
            
            new_pdf = PdfTemplate(
                original_filename=original_filename,
                stored_filename=unique_filename
            )
            db.session.add(new_pdf)
            db.session.commit()
            return jsonify({'message': 'File uploaded successfully', 'template': new_pdf.to_dict()}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to upload file: {str(e)}'}), 500
    
    return jsonify({'error': 'File type not allowed'}), 400


@app.route('/pdf_templates/<int:pdf_id>', methods=['DELETE'])
def delete_pdf_template(pdf_id):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /pdf_templates/{pdf_id} endpoint ---")
    # --- Debugging End ---
    pdf_template = PdfTemplate.query.get(pdf_id)
    if not pdf_template:
        return jsonify({'error': 'PDF template not found'}), 404

    try:
        settings = AppSettings.query.get(1)
        if settings and settings.default_pdf_id == pdf_template.id:
            return jsonify({'error': 'Cannot delete default PDF template. Please set another default first.'}), 400

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], pdf_template.stored_filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            
        db.session.delete(pdf_template)
        db.session.commit()
        return jsonify({'message': 'PDF template deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete PDF template: {str(e)}'}), 500


@app.route('/app_settings/default_pdf', methods=['POST'])
def set_default_pdf():
    # --- Debugging Start ---
    print("--- app.py: Registering /app_settings/default_pdf endpoint ---")
    # --- Debugging End ---
    data = request.json
    default_pdf_id = data.get('default_pdf_id')

    if default_pdf_id is not None:
        pdf_exists = PdfTemplate.query.get(default_pdf_id)
        if not pdf_exists:
            return jsonify({'error': 'Selected PDF template does not exist.'}), 404

    settings = AppSettings.query.get(1)
    if not settings:
        settings = AppSettings(id=1)
        db.session.add(settings)
    
    settings.default_pdf_id = default_pdf_id
    
    try:
        db.session.commit()
        return jsonify({'message': 'Default PDF template updated successfully', 'settings': settings.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to set default PDF: {str(e)}'}), 500


@app.route('/app_settings', methods=['GET'])
def get_app_settings():
    # --- Debugging Start ---
    print("--- app.py: Registering /app_settings endpoint ---")
    # --- Debugging End ---
    settings = AppSettings.query.get(1)
    if not settings:
        return jsonify({'default_pdf_id': None, 'default_pdf_name': None}), 200
    return jsonify(settings.to_dict()), 200


@app.route('/pdf_templates/download/<string:stored_filename>', methods=['GET'])
def download_pdf_template(stored_filename):
    # --- Debugging Start ---
    print(f"--- app.py: Registering /pdf_templates/download/{stored_filename} endpoint ---")
    # --- Debugging End ---
    if not secure_filename(stored_filename) == stored_filename:
        return jsonify({'error': 'Invalid filename'}), 400
    
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], stored_filename)
    except Exception as e:
        app.logger.error(f"Error serving PDF file {stored_filename}: {str(e)}")
        return jsonify({'error': 'File not found or access denied'}), 404


if __name__ == '__main__':
    # Ensure the instance and uploads directories exist
    instance_path = os.path.join(app.root_path, 'instance')
    os.makedirs(instance_path, exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True) # Use app.config here for consistency
    # The 'flask db upgrade' command in docker-compose handles initial migration
    # and database creation.
    app.run(debug=True, host='0.0.0.0')