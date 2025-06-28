# backend/app.py
# This is the main Flask application for the network documentation backend.
# It defines the database models, API endpoints, and handles CRUD operations.

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS # For handling Cross-Origin Resource Sharing

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

class PC(db.Model):
    __tablename__ = 'pcs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100), nullable=True) # Added IP address field
    description = db.Column(db.String(255))
    # Relationship to connections (one-to-many)
    connections = db.relationship('Connection', backref='pc', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address, # Include IP address in dictionary representation
            'description': self.description
        }

class PatchPanel(db.Model):
    __tablename__ = 'patch_panels'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    location = db.Column(db.String(255))
    # Relationship to connections (one-to-many)
    connections = db.relationship('Connection', backref='patch_panel', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location
        }

class Server(db.Model):
    __tablename__ = 'servers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100))
    location = db.Column(db.String(255))
    # Relationship to connections (one-to-many)
    connections = db.relationship('Connection', backref='server', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'location': self.location
        }

class Connection(db.Model):
    __tablename__ = 'connections'
    id = db.Column(db.Integer, primary_key=True)
    pc_id = db.Column(db.Integer, db.ForeignKey('pcs.id'), nullable=False)
    patch_panel_id = db.Column(db.Integer, db.ForeignKey('patch_panels.id'), nullable=False)
    patch_panel_port = db.Column(db.String(50), nullable=False)
    server_id = db.Column(db.Integer, db.ForeignKey('servers.id'), nullable=False)
    server_port = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'pc': self.pc.to_dict() if self.pc else None,
            'patch_panel': self.patch_panel.to_dict() if self.patch_panel else None,
            'patch_panel_port': self.patch_panel_port,
            'server': self.server.to_dict() if self.server else None,
            'server_port': self.server_port
        }

# --- API Endpoints ---
# Define the routes for your RESTful API.

@app.route('/')
def index():
    return "Welcome to the Network Documentation Backend API!"

# PC Endpoints
@app.route('/pcs', methods=['GET', 'POST'])
def handle_pcs():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'PC name is required'}), 400
        new_pc = PC(name=data['name'], ip_address=data.get('ip_address'), description=data.get('description')) # Accept ip_address
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
        pc.ip_address = data.get('ip_address', pc.ip_address) # Allow updating ip_address
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

# Patch Panel Endpoints
@app.route('/patch_panels', methods=['GET', 'POST'])
def handle_patch_panels():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Patch Panel name is required'}), 400
        new_pp = PatchPanel(name=data['name'], location=data.get('location'))
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

# Server Endpoints
@app.route('/servers', methods=['GET', 'POST'])
def handle_servers():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Server name is required'}), 400
        new_server = Server(name=data['name'], ip_address=data.get('ip_address'), location=data.get('location'))
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

# Connection Endpoints
@app.route('/connections', methods=['GET', 'POST'])
def handle_connections():
    if request.method == 'POST':
        data = request.json
        required_fields = ['pc_id', 'patch_panel_id', 'patch_panel_port', 'server_id', 'server_port']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields for connection'}), 400

        new_connection = Connection(
            pc_id=data['pc_id'],
            patch_panel_id=data['patch_panel_id'],
            patch_panel_port=data['patch_panel_port'],
            server_id=data['server_id'],
            server_port=data['server_port']
        )
        try:
            db.session.add(new_connection)
            db.session.commit()
            # Reload the connection to include related objects (PC, PatchPanel, Server)
            db.session.refresh(new_connection)
            return jsonify(new_connection.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    else: # GET
        connections = Connection.query.all()
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
        connection.pc_id = data.get('pc_id', connection.pc_id)
        connection.patch_panel_id = data.get('patch_panel_id', connection.patch_panel_id)
        connection.patch_panel_port = data.get('patch_panel_port', connection.patch_panel_port)
        connection.server_id = data.get('server_id', connection.server_id)
        connection.server_port = data.get('server_port', connection.server_port)
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

if __name__ == '__main__':
    # Ensure the instance directory exists for SQLite database
    instance_path = os.path.join(app.root_path, 'instance')
    os.makedirs(instance_path, exist_ok=True)
    # The 'flask db upgrade' command in docker-compose handles initial migration
    # and database creation.
    app.run(debug=True, host='0.0.0.0')
