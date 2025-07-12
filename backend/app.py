# backend/app.py
# This is the main Flask application for the network documentation backend.
<<<<<<< Updated upstream
# It defines the database models, API endpoints, and handles CRUD operations.

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS # For handling Cross-Origin Resource Sharing
from sqlalchemy.orm import joinedload # To eager load related data

import os
=======
# UPDATED: Refactored to load from a config file and fixed data persistence paths.

import os
from flask import Flask
from flask_cors import CORS
>>>>>>> Stashed changes

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Database configuration
# Using SQLite for simplicity. The database file will be stored in the 'instance' folder.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///network_doc.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

<<<<<<< Updated upstream
# --- Database Models ---
# Define the structure of your data tables.

class PC(db.Model):
    __tablename__ = 'pcs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(255))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'description': self.description
        }

class PatchPanel(db.Model):
    __tablename__ = 'patch_panels'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    location = db.Column(db.String(255))
    total_ports = db.Column(db.Integer, nullable=False, default=1) # New: Total number of ports

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'total_ports': self.total_ports
        }

class Server(db.Model):
    __tablename__ = 'servers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100))
    location = db.Column(db.String(255))
    total_ports = db.Column(db.Integer, nullable=False, default=1) # New: Total number of ports

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'location': self.location,
            'total_ports': self.total_ports
        }

class Connection(db.Model):
    __tablename__ = 'connections'
    id = db.Column(db.Integer, primary_key=True)
    pc_id = db.Column(db.Integer, db.ForeignKey('pcs.id'), nullable=False)
    server_id = db.Column(db.Integer, db.ForeignKey('servers.id'), nullable=False)
    server_port = db.Column(db.String(50), nullable=False)
    is_server_port_up = db.Column(db.Boolean, nullable=False, default=True) # New: Server port status

    pc = db.relationship('PC', backref='connections_as_pc', lazy=True)
    server = db.relationship('Server', backref='connections_as_server', lazy=True)
    hops = db.relationship('ConnectionHop', backref='connection', lazy=True, cascade="all, delete-orphan", order_by="ConnectionHop.sequence")


    def to_dict(self):
        return {
            'id': self.id,
            'pc': self.pc.to_dict() if self.pc else None,
            'hops': [hop.to_dict() for hop in self.hops],
            'server': self.server.to_dict() if self.server else None,
            'server_port': self.server_port,
            'is_server_port_up': self.is_server_port_up
        }

class ConnectionHop(db.Model):
    __tablename__ = 'connection_hops'
    id = db.Column(db.Integer, primary_key=True)
    connection_id = db.Column(db.Integer, db.ForeignKey('connections.id'), nullable=False)
    patch_panel_id = db.Column(db.Integer, db.ForeignKey('patch_panels.id'), nullable=False)
    patch_panel_port = db.Column(db.String(50), nullable=False)
    is_port_up = db.Column(db.Boolean, nullable=False, default=True) # New: Patch panel port status
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
    Checks if a given port on a patch panel or server is already in use.
    Returns (True, conflicting_pc_name) if occupied, (False, None) if available.
    """
    if entity_type == 'patch_panel':
        # Find connections that use this patch_panel_id and patch_panel_port
        conflicting_hops = ConnectionHop.query.options(joinedload(ConnectionHop.connection).joinedload(Connection.pc)).filter(
            ConnectionHop.patch_panel_id == target_id,
            ConnectionHop.patch_panel_port == port_number
        )
        if exclude_connection_id:
            conflicting_hops = conflicting_hops.filter(ConnectionHop.connection_id != exclude_connection_id)
        
        conflicting_hop = conflicting_hops.first()
        if conflicting_hop:
            return True, conflicting_hop.connection.pc.name if conflicting_hop.connection.pc else "Unknown PC"
    elif entity_type == 'server':
        # Find connections that use this server_id and server_port
        conflicting_connections = Connection.query.options(joinedload(Connection.pc)).filter(
            Connection.server_id == target_id,
            Connection.server_port == port_number
        )
        if exclude_connection_id:
            conflicting_connections = conflicting_connections.filter(Connection.id != exclude_connection_id)
        
        conflicting_connection = conflicting_connections.first()
        if conflicting_connection:
            return True, conflicting_connection.pc.name if conflicting_connection.pc else "Unknown PC"
    return False, None


# PC Endpoints (no changes to logic, only to_dict outputs new IP field)
@app.route('/pcs', methods=['GET', 'POST'])
def handle_pcs():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'PC name is required'}), 400
        new_pc = PC(name=data['name'], ip_address=data.get('ip_address'), description=data.get('description'))
        try:
            db.session.add(new_pc)
=======

def create_admin_user_if_not_exists(app):
    """Create a default admin user if no users exist in the database."""
    with app.app_context():
        if not User.query.first():
            print("No users found. Creating default admin user...")
            hashed_password = bcrypt.generate_password_hash('admin').decode('utf-8')
            admin_user = User(username='admin', password_hash=hashed_password, role='Admin')
            db.session.add(admin_user)
>>>>>>> Stashed changes
            db.session.commit()
            return jsonify(new_pc.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        pcs = PC.query.all()
        return jsonify([pc.to_dict() for pc in pcs])

<<<<<<< Updated upstream
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

# Patch Panel Endpoints (added total_ports)
@app.route('/patch_panels', methods=['GET', 'POST'])
def handle_patch_panels():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Patch Panel name is required'}), 400
        # Ensure total_ports is an integer, default to 1
        total_ports = int(data.get('total_ports', 1)) if str(data.get('total_ports', 1)).isdigit() else 1
        new_pp = PatchPanel(
            name=data['name'],
            location=data.get('location'),
            total_ports=total_ports
        )
        try:
            db.session.add(new_pp)
            db.session.commit()
            return jsonify(new_pp.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        patch_panels = PatchPanel.query.all()
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
        pp.location = data.get('location', pp.location)
        # Ensure total_ports is an integer, default to current value
        pp.total_ports = int(data.get('total_ports', pp.total_ports)) if str(data.get('total_ports', pp.total_ports)).isdigit() else pp.total_ports
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

# Server Endpoints (added total_ports)
@app.route('/servers', methods=['GET', 'POST'])
def handle_servers():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Server name is required'}), 400
        # Ensure total_ports is an integer, default to 1
        total_ports = int(data.get('total_ports', 1)) if str(data.get('total_ports', 1)).isdigit() else 1
        new_server = Server(
            name=data['name'],
            ip_address=data.get('ip_address'),
            location=data.get('location'),
            total_ports=total_ports
        )
        try:
            db.session.add(new_server)
            db.session.commit()
            return jsonify(new_server.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        servers = Server.query.all()
        return jsonify([server.to_dict() for server in servers])

@app.route('/servers/<int:server_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_server_by_id(server_id):
    server = Server.query.get_or_404(server_id)
    if request.method == 'GET':
        return jsonify(server.to_dict())
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided for update'}), 400
        server.name = data.get('name', server.name)
        server.ip_address = data.get('ip_address', server.ip_address)
        server.location = data.get('location', server.location)
        # Ensure total_ports is an integer, default to current value
        server.total_ports = int(data.get('total_ports', server.total_ports)) if str(data.get('total_ports', server.total_ports)).isdigit() else server.total_ports
        try:
            db.session.commit()
            return jsonify(server.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # DELETE
        try:
            db.session.delete(server)
            db.session.commit()
            return jsonify({'message': 'Server deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

# Connection Endpoints (updated for multi-hop, port status, and validation)
@app.route('/connections', methods=['GET', 'POST'])
def handle_connections():
    if request.method == 'POST':
        data = request.json
        required_fields = ['pc_id', 'server_id', 'server_port', 'is_server_port_up', 'hops']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields for connection'}), 400

        # Validate Server Port occupancy
        is_occupied, conflicting_pc = validate_port_occupancy(
            target_id=data['server_id'],
            port_number=data['server_port'],
            entity_type='server'
        )
        if is_occupied:
            return jsonify({'error': f'Server port {data["server_port"]} is already in use by PC: {conflicting_pc}'}), 409 # Conflict

        new_connection = Connection(
            pc_id=data['pc_id'],
            server_id=data['server_id'],
            server_port=data['server_port'],
            is_server_port_up=data['is_server_port_up']
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
            joinedload(Connection.server),
            joinedload(Connection.hops).joinedload(ConnectionHop.patch_panel)
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

        # Validate Server Port occupancy (excluding current connection)
        if 'server_id' in data and 'server_port' in data:
            is_occupied, conflicting_pc = validate_port_occupancy(
                target_id=data['server_id'],
                port_number=data['server_port'],
                entity_type='server',
                exclude_connection_id=conn_id # Exclude current connection from conflict check
            )
            if is_occupied:
                return jsonify({'error': f'Server port {data["server_port"]} is already in use by PC: {conflicting_pc}'}), 409

        connection.pc_id = data.get('pc_id', connection.pc_id)
        connection.server_id = data.get('server_id', connection.server_id)
        connection.server_port = data.get('server_port', connection.server_port)
        connection.is_server_port_up = data.get('is_server_port_up', connection.is_server_port_up)

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
                    exclude_connection_id=conn_id # Exclude current connection from conflict check
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
    patch_panel = PatchPanel.query.get_or_404(pp_id)
    
    # Handle non-integer total_ports gracefully, default to 0 if invalid
    try:
        total_ports_int = int(patch_panel.total_ports)
    except (ValueError, TypeError):
        total_ports_int = 0 # Default to 0 or handle as an error case

    all_ports = list(range(1, total_ports_int + 1))
    
    used_hops = ConnectionHop.query.options(joinedload(ConnectionHop.connection).joinedload(Connection.pc)).filter(
        ConnectionHop.patch_panel_id == pp_id
    ).all()

    connected_ports_info = {}
    for hop in used_hops:
        try:
            port_num = int(hop.patch_panel_port) # Safely convert port number to int
            if 1 <= port_num <= total_ports_int:
                connected_ports_info[port_num] = {
                    'connected_by_pc': hop.connection.pc.name if hop.connection.pc else "Unknown PC",
                    'connection_id': hop.connection_id,
                    'is_up': hop.is_port_up
                }
        except (ValueError, TypeError):
            # Log error for non-integer port numbers if necessary
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
        'total_ports': patch_panel.total_ports,
        'ports': port_status
    })

@app.route('/servers/<int:server_id>/ports', methods=['GET'])
def get_server_ports(server_id):
    server = Server.query.get_or_404(server_id)
    
    # Handle non-integer total_ports gracefully, default to 0 if invalid
    try:
        total_ports_int = int(server.total_ports)
    except (ValueError, TypeError):
        total_ports_int = 0 # Default to 0 or handle as an error case

    all_ports = list(range(1, total_ports_int + 1))

    used_connections = Connection.query.options(joinedload(Connection.pc)).filter(
        Connection.server_id == server_id
    ).all()

    connected_ports_info = {}
    for conn in used_connections:
        try:
            port_num = int(conn.server_port) # Safely convert port number to int
            if 1 <= port_num <= total_ports_int:
                connected_ports_info[port_num] = {
                    'connected_by_pc': conn.pc.name if conn.pc else "Unknown PC",
                    'connection_id': conn.id,
                    'is_up': conn.is_server_port_up
                }
        except (ValueError, TypeError):
            # Log error for non-integer port numbers if necessary
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
        'server_id': server_id,
        'server_name': server.name,
        'total_ports': server.total_ports,
        'ports': port_status
    })

=======

def create_app(config_object='backend.config.Config'):
    """
    Factory function to create and configure the Flask application.
    It loads configuration from a dedicated config object and ensures
    database and upload paths are correctly set to use the persistent volume.
    """
    app = Flask(__name__)

    # --- Configuration ---
    # Load base configuration from the specified config class
    app.config.from_object(config_object)

    # Define the persistent data directory path inside the container.
    # This path MUST match the volume mount in docker-compose.yml.
    # e.g., `network_doc_db:/app/backend/instance`
    persistent_data_path = os.path.join('/app', 'backend', 'instance')

    # Ensure the directory for the database and uploads exists
    pdf_upload_path = os.path.join(persistent_data_path, 'uploads', 'pdf_templates')
    os.makedirs(pdf_upload_path, exist_ok=True)

    # **Override specific configurations to use the correct persistent paths**
    # This ensures the SQLite DB and uploads are stored in the docker volume.
    app.config.update(
        SQLALCHEMY_DATABASE_URI=f'sqlite:///{os.path.join(persistent_data_path, "network_doc.db")}',
        UPLOAD_FOLDER=pdf_upload_path
    )

    # --- Initialize Extensions ---
    CORS(app, supports_credentials=True)
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # --- Register Blueprints/Routes ---
    register_routes(app)

    # --- Register Custom CLI Commands ---
    @app.cli.command("seed")
    def seed_db():
        """Seeds the database with initial data (e.g., admin user)."""
        create_admin_user_if_not_exists(app)

    return app

>>>>>>> Stashed changes

# This conditional is for running the app directly (e.g., `python -m backend.app`)
# Gunicorn will call the `create_app` factory directly.
if __name__ == '__main__':
<<<<<<< Updated upstream
    # Ensure the instance directory exists for SQLite database
    instance_path = os.path.join(app.root_path, 'instance')
    os.makedirs(instance_path, exist_ok=True)
    # The 'flask db upgrade' command in docker-compose handles initial migration
    # and database creation.
    app.run(debug=True, host='0.0.0.0')
=======
    app = create_app()
    app.run(debug=True, host='0.0.0.0')
>>>>>>> Stashed changes
