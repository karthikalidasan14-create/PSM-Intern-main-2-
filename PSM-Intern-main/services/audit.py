from extensions import db
from models import AuditLog


def log_action(actor_email, action, entity_type=None, entity_id=None, details=None):
    entry = AuditLog(
        actor_email=actor_email,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=details,
    )
    db.session.add(entry)
    db.session.commit()
    return entry
