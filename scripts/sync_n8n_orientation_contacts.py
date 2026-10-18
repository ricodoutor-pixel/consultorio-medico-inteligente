import sqlite3
import json
import time
import os

DB_PATH = '/var/lib/docker/volumes/n8n-a3wy_n8n_data/_data/database.sqlite'
OUT_FILE = '/opt/plantayraiz/scripts/n8n_active_orientation_contacts.json'

def sync():
    active_phones = set()
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT staticData FROM workflow_entity WHERE id = 'LdAWxfIxg0s67H32'")
            row = c.fetchone()
            conn.close()
            if row and row[0]:
                data = json.loads(row[0]).get('global', {})
                pagos = data.get('pagos', {})
                for phone, info in pagos.items():
                    if isinstance(info, dict) and not info.get('encerrado'):
                        clean = ''.join(ch for ch in str(phone) if ch.isdigit())
                        if clean:
                            active_phones.add(clean)
                pedidos = data.get('pedidosAbertos', {})
                for phone in pedidos:
                    clean = ''.join(ch for ch in str(phone) if ch.isdigit())
                    if clean:
                        active_phones.add(clean)
        except Exception as e:
            print(f"Error reading n8n sqlite: {e}")

    payload = {
        'activePatients': list(active_phones),
        'updated_at': time.time(),
        'count': len(active_phones)
    }

    try:
        with open(OUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2)
        print(f"Synced {len(active_phones)} active n8n orientation contacts to {OUT_FILE}")
    except Exception as e:
        print(f"Error writing out file: {e}")

if __name__ == '__main__':
    sync()
