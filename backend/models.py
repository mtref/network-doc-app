# backend/models.py
# This file defines the SQLAlchemy database models for the application.

from .extensions import db # Import db from extensions.py

class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    door_number = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        """Converts a Location object to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'door_number': self.door_number
        }

class Rack(db.Model):
    __tablename__ = 'racks'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    # Define relationship to Location model
    location = db.relationship('Location', backref='racks_in_location', lazy=True)
    description = db.Column(db.String(255), nullable=True)
    total_units = db.Column(db.Integer, nullable=False, default=42)
    orientation = db.Column(db.String(50), nullable=False, default='bottom-up')

    # Composite Unique Constraint: name must be unique within a given location
    __table_args__ = (db.UniqueConstraint('name', 'location_id', name='_name_location_uc'),)

    def to_dict(self):
        """Converts a Rack object to a dictionary, including related location data."""
        return {
            'id': self.id,
            'name': self.name,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'location': self.location.to_dict() if self.location else None, # Include full location dict
            'description': self.description,
            'total_units': self.total_units,
            'orientation': self.orientation,
        }

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
    type = db.Column(db.String(50), nullable=False, default='Workstation') # e.g., 'Workstation', 'Server'
    usage = db.Column(db.String(100), nullable=True) # e.g., 'Production', 'Development'
    
    # Fields for linking to Rack for 'Server' type PCs
    row_in_rack = db.Column(db.Integer, nullable=True) # Changed to Integer
    rack_id = db.Column(db.Integer, db.ForeignKey('racks.id'), nullable=True)
    units_occupied = db.Column(db.Integer, nullable=False, default=1) # NEW field: units_occupied
    # Define relationship to Rack model
    rack = db.relationship('Rack', backref='pcs_in_rack', lazy=True)

    def to_dict(self):
        """Converts a PC object to a dictionary, including related rack data."""
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
            'row_in_rack': self.row_in_rack,
            'rack_id': self.rack_id,
            'units_occupied': self.units_occupied, # Include in to_dict
            'rack_name': self.rack.name if self.rack else None, # Denormalized rack name for convenience
            'rack': self.rack.to_dict() if self.rack else None, # Include full rack dict
        }

class PatchPanel(db.Model):
    __tablename__ = 'patch_panels'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    location = db.relationship('Location', backref='patch_panels_in_location', lazy=True)
    row_in_rack = db.Column(db.Integer, nullable=True) # Changed to Integer
    rack_id = db.Column(db.Integer, db.ForeignKey('racks.id'), nullable=True)
    units_occupied = db.Column(db.Integer, nullable=False, default=1) # NEW field: units_occupied
    rack = db.relationship('Rack', backref='patch_panels_in_rack', lazy=True)
    total_ports = db.Column(db.Integer, nullable=False, default=1)
    description = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        """Converts a PatchPanel object to a dictionary, including related location and rack data."""
        return {
            'id': self.id,
            'name': self.name,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'row_in_rack': self.row_in_rack,
            'rack_id': self.rack_id,
            'units_occupied': self.units_occupied, # Include in to_dict
            'rack_name': self.rack.name if self.rack else None,
            'total_ports': self.total_ports,
            'description': self.description,
            'location': self.location.to_dict() if self.location else None, # Include full location dict
            'rack': self.rack.to_dict() if self.rack else None, # Include full rack dict
        }

class Switch(db.Model):
    __tablename__ = 'switches'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ip_address = db.Column(db.String(100), nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    location = db.relationship('Location', backref='switches_in_location', lazy=True)
    row_in_rack = db.Column(db.Integer, nullable=True) # Changed to Integer
    rack_id = db.Column(db.Integer, db.ForeignKey('racks.id'), nullable=True)
    units_occupied = db.Column(db.Integer, nullable=False, default=1) # NEW field: units_occupied
    rack = db.relationship('Rack', backref='switches_in_rack', lazy=True)
    total_ports = db.Column(db.Integer, nullable=False, default=1)
    source_port = db.Column(db.String(100), nullable=True) # e.g., "Eth0/1", "GigaPort-03"
    model = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(255), nullable=True)
    usage = db.Column(db.String(100), nullable=True) # e.g., 'Core', 'Access', 'Distribution'

    def to_dict(self):
        """Converts a Switch object to a dictionary, including related location and rack data."""
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'row_in_rack': self.row_in_rack,
            'rack_id': self.rack_id,
            'units_occupied': self.units_occupied, # Include in to_dict
            'rack_name': self.rack.name if self.rack else None,
            'total_ports': self.total_ports,
            'source_port': self.source_port,
            'model': self.model,
            'description': self.description,
            'usage': self.usage,
            'location': self.location.to_dict() if self.location else None, # Include full location dict
            'rack': self.rack.to_dict() if self.rack else None, # Include full rack dict
        }

class Connection(db.Model):
    __tablename__ = 'connections'
    id = db.Column(db.Integer, primary_key=True)
    pc_id = db.Column(db.Integer, db.ForeignKey('pcs.id'), nullable=False)
    switch_id = db.Column(db.Integer, db.ForeignKey('switches.id'), nullable=False)
    switch_port = db.Column(db.String(50), nullable=False)
    is_switch_port_up = db.Column(db.Boolean, nullable=False, default=True)
    cable_color = db.Column(db.String(50), nullable=True)
    cable_label = db.Column(db.String(100), nullable=True)

    # Define relationships to PC and Switch models
    pc = db.relationship('PC', backref='connections_as_pc', lazy=True)
    switch = db.relationship('Switch', backref='connections_as_switch', lazy=True)
    # Define relationship to ConnectionHop, cascading deletes
    hops = db.relationship('ConnectionHop', backref='connection', lazy=True, cascade="all, delete-orphan", order_by="ConnectionHop.sequence")

    def to_dict(self):
        """Converts a Connection object to a dictionary, including related PC, Switch, and Hops data."""
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

class ConnectionHop(db.Model):
    __tablename__ = 'connection_hops'
    id = db.Column(db.Integer, primary_key=True)
    connection_id = db.Column(db.Integer, db.ForeignKey('connections.id'), nullable=False)
    patch_panel_id = db.Column(db.Integer, db.ForeignKey('patch_panels.id'), nullable=False)
    patch_panel_port = db.Column(db.String(50), nullable=False)
    is_port_up = db.Column(db.Boolean, nullable=False, default=True)
    sequence = db.Column(db.Integer, nullable=False) # Order of hops in a connection
    cable_color = db.Column(db.String(50), nullable=True)
    cable_label = db.Column(db.String(100), nullable=True)

    # Define relationship to PatchPanel model
    patch_panel = db.relationship('PatchPanel', backref='connection_hops', lazy=True)

    def to_dict(self):
        """Converts a ConnectionHop object to a dictionary, including related PatchPanel data."""
        return {
            'id': self.id,
            'patch_panel': self.patch_panel.to_dict() if self.patch_panel else None,
            'patch_panel_port': self.patch_panel_port,
            'is_port_up': self.is_port_up,
            'sequence': self.sequence,
            'cable_color': self.cable_color,
            'cable_label': self.cable_label
        }

class PdfTemplate(db.Model):
    __tablename__ = 'pdf_templates'
    id = db.Column(db.Integer, primary_key=True)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), unique=True, nullable=False)
    upload_date = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

    def to_dict(self):
        """Converts a PdfTemplate object to a dictionary."""
        return {
            'id': self.id,
            'original_filename': self.original_filename,
            'stored_filename': self.stored_filename,
            'upload_date': self.upload_date.isoformat()
        }

class AppSettings(db.Model):
    __tablename__ = 'app_settings'
    id = db.Column(db.Integer, primary_key=True)
    default_pdf_id = db.Column(db.Integer, db.ForeignKey('pdf_templates.id'), nullable=True)
    # Define relationship to PdfTemplate model
    default_pdf = db.relationship('PdfTemplate', backref='app_settings', lazy=True)

    def to_dict(self):
        """Converts an AppSettings object to a dictionary, including default PDF name."""
        return {
            'id': self.id,
            'default_pdf_id': self.default_pdf_id,
            'default_pdf_name': self.default_pdf.original_filename if self.default_pdf else None
        }