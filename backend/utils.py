# backend/utils.py
# This file contains helper functions used across various modules in the backend.

import os
from werkzeug.utils import secure_filename
from sqlalchemy.orm import joinedload
from sqlalchemy import cast, Integer

# Import models to be used in helper functions for database queries
from .models import Location, Rack, PC, PatchPanel, Switch, Connection, ConnectionHop, PdfTemplate

# --- Global Constants ---
MAX_HOPS = 5 # Maximum number of hops to export/import for connections

# --- File Upload Utilities ---
def allowed_file(filename, allowed_extensions):
    """
    Checks if a file's extension is allowed.
    :param filename: The name of the file.
    :param allowed_extensions: A set of allowed extensions (e.g., {'pdf', 'png'}).
    :return: True if the file extension is allowed, False otherwise.
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def save_uploaded_file(file, upload_folder):
    """
    Saves an uploaded file to the specified folder with a secure and unique filename.
    :param file: The uploaded file object from Flask's request.files.
    :param upload_folder: The directory where the file should be saved.
    :return: The unique filename under which the file was stored.
    """
    original_filename = file.filename
    # Generate a unique filename using UUID to prevent collisions
    unique_filename = str(uuid.uuid4()) + '.' + original_filename.rsplit('.', 1)[1].lower()
    filepath = os.path.join(upload_folder, unique_filename)
    file.save(filepath)
    return unique_filename

# --- Database Validation Utilities ---
def validate_port_occupancy(db_session, target_id, port_number, entity_type, exclude_connection_id=None):
    """
    Checks if a given port on a patch panel or switch is already in use.
    Returns (True, conflicting_pc_name) if occupied, (False, None) if available.
    :param db_session: The SQLAlchemy session object.
    :param target_id: The ID of the Patch Panel or Switch.
    :param port_number: The port number to check.
    :param entity_type: 'patch_panel' or 'switch'.
    :param exclude_connection_id: Optional. If provided, a connection with this ID will be ignored
                                  in the check (useful for updates).
    :return: A tuple (is_occupied, conflicting_pc_name)
    """
    if entity_type == 'patch_panel':
        conflicting_hops = db_session.query(ConnectionHop).options(
            joinedload(ConnectionHop.connection).joinedload(Connection.pc)
        ).filter(
            ConnectionHop.patch_panel_id == target_id,
            ConnectionHop.patch_panel_port == port_number
        )
        if exclude_connection_id:
            conflicting_hops = conflicting_hops.filter(ConnectionHop.connection_id != exclude_connection_id)
        
        conflicting_hop = conflicting_hops.first()
        if conflicting_hop:
            return True, conflicting_hop.connection.pc.name if conflicting_hop.connection.pc else "Unknown PC"
    elif entity_type == 'switch':
        conflicting_connections = db_session.query(Connection).options(
            joinedload(Connection.pc)
        ).filter(
            Connection.switch_id == target_id,
            Connection.switch_port == port_number
        )
        if exclude_connection_id:
            conflicting_connections = conflicting_connections.filter(Connection.id != exclude_connection_id)
        
        conflicting_connection = conflicting_connections.first()
        if conflicting_connection:
            return True, conflicting_connection.pc.name if conflicting_connection.pc else "Unknown PC"
    return False, None

def validate_rack_unit_occupancy(db_session, rack_id, row_in_rack, device_type, exclude_device_id=None):
    """
    Checks if a specific row in a rack is already occupied by another device.
    Returns (True, conflicting_device_name) if occupied, (False, None) if available.
    :param db_session: The SQLAlchemy session object.
    :param rack_id: The ID of the Rack.
    :param row_in_rack: The row number/identifier in the rack.
    :param device_type: 'pc', 'patch_panel', or 'switch'.
    :param exclude_device_id: Optional. If provided, a device with this ID will be ignored
                              in the check (useful for updates).
    :return: A tuple (is_occupied, conflicting_device_name)
    """
    if not rack_id or not row_in_rack:
        return False, None # No rack or row specified, so no conflict check needed

    # Check Switches
    switches_in_row = db_session.query(Switch).filter(
        Switch.rack_id == rack_id,
        Switch.row_in_rack == row_in_rack
    )
    if device_type == 'switch' and exclude_device_id:
        switches_in_row = switches_in_row.filter(Switch.id != exclude_device_id)
    
    conflicting_switch = switches_in_row.first()
    if conflicting_switch:
        return True, f"Switch '{conflicting_switch.name}'"

    # Check Patch Panels
    patch_panels_in_row = db_session.query(PatchPanel).filter(
        PatchPanel.rack_id == rack_id,
        PatchPanel.row_in_rack == row_in_rack
    )
    if device_type == 'patch_panel' and exclude_device_id:
        patch_panels_in_row = patch_panels_in_row.filter(PatchPanel.id != exclude_device_id)
    
    conflicting_pp = patch_panels_in_row.first()
    if conflicting_pp:
        return True, f"Patch Panel '{conflicting_pp.name}'"

    # Check PCs (of type 'Server')
    pcs_in_row = db_session.query(PC).filter(
        PC.rack_id == rack_id,
        PC.row_in_rack == row_in_rack,
        PC.type == 'Server' # Only servers occupy rack space
    )
    if device_type == 'pc' and exclude_device_id:
        pcs_in_row = pcs_in_row.filter(PC.id != exclude_device_id)
    
    conflicting_pc = pcs_in_row.first()
    if conflicting_pc:
        return True, f"PC '{conflicting_pc.name}' (Server)"

    return False, None

def check_rack_unit_decrease_conflict(db_session, rack_id, new_total_units):
    """
    Checks if decreasing the total_units of a rack would conflict with existing devices.
    Returns (True, error_message) if conflict, (False, None) otherwise.
    :param db_session: The SQLAlchemy session object.
    :param rack_id: The ID of the Rack being updated.
    :param new_total_units: The proposed new total number of units for the rack.
    :return: A tuple (has_conflict, error_message)
    """
    # Check Switches in this rack
    conflicting_switches = db_session.query(Switch).filter(
        Switch.rack_id == rack_id,
        Switch.row_in_rack.isnot(None),
        cast(Switch.row_in_rack, Integer) > new_total_units
    ).first()
    if conflicting_switches:
        return True, f"Cannot decrease total units to {new_total_units}U. Switch '{conflicting_switches.name}' is assigned to row {conflicting_switches.row_in_rack}."

    # Check Patch Panels in this rack
    conflicting_pps = db_session.query(PatchPanel).filter(
        PatchPanel.rack_id == rack_id,
        PatchPanel.row_in_rack.isnot(None),
        cast(PatchPanel.row_in_rack, Integer) > new_total_units
    ).first()
    if conflicting_pps:
        return True, f"Cannot decrease total units to {new_total_units}U. Patch Panel '{conflicting_pps.name}' is assigned to row {conflicting_pps.row_in_rack}."

    # Check Server PCs in this rack
    conflicting_pcs = db_session.query(PC).filter(
        PC.rack_id == rack_id,
        PC.type == 'Server',
        PC.row_in_rack.isnot(None),
        cast(PC.row_in_rack, Integer) > new_total_units
    ).first()
    if conflicting_pcs:
        return True, f"Cannot decrease total units to {new_total_units}U. Server PC '{conflicting_pcs.name}' is assigned to row {conflicting_pcs.row_in_rack}."
    
    return False, None
