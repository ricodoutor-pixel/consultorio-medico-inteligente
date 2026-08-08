import json
import re
import os

transcript_path = r"C:\Users\ricod\.gemini\antigravity\brain\f80a569b-8eec-4609-9c48-09637e2e828b\.system_generated\logs\transcript_full.jsonl"

def parse_full():
    print("📖 Lendo transcript_full para extração completa...")
    with open(transcript_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    last_user_text = ""
    for line in reversed(lines):
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT' or data.get('source') == 'USER_EXPLICIT':
                content = str(data.get('content', ''))
                if 'Ari da Silva Avelar' in content or 'Especialidade:' in content:
                    last_user_text = content
                    break
        except Exception:
            pass

    if not last_user_text:
        print("❌ Texto não encontrado em transcript_full.jsonl")
        return

    # Regular expression pattern to match doctor blocks
    # Format pattern:
    # <Name>
    # Especialidade: <Esp>
    # Cidade: <Cidade>
    # Estado: <Estado>
    # Email: <Email>
    # Telefone: <Telefone>

    block_pattern = re.compile(
        r'([A-ZÀ-Úa-zà-ú\s\.\-\'\’]+?)\n'
        r'Especialidade:\s*(.*?)\n'
        r'Cidade:\s*(.*?)\n'
        r'Estado:\s*(.*?)\n'
        r'Email:\s*(.*?)\n'
        r'Telefone:\s*(.*?)(?=\n[A-ZÀ-Úa-zà-ú\s\.\-\'\’]+\nEspecialidade:|\Z)',
        re.DOTALL
    )

    doctors = []
    
    # Also manual line by line parsing fallback
    raw_lines = [l.strip() for l in last_user_text.split('\n') if l.strip()]
    
    curr = {}
    for line in raw_lines:
        if line.startswith("Especialidade:"):
            curr["especialidade"] = line.replace("Especialidade:", "").strip()
        elif line.startswith("Cidade:"):
            curr["cidade"] = line.replace("Cidade:", "").strip()
        elif line.startswith("Estado:"):
            curr["estado"] = line.replace("Estado:", "").strip()
        elif line.startswith("Email:"):
            curr["email"] = line.replace("Email:", "").strip()
        elif line.startswith("Telefone:"):
            raw_tel = line.replace("Telefone:", "").strip()
            curr["telefone_raw"] = raw_tel
            
            # Extract phone numbers
            parts = re.split(r'[\/\,\;]', raw_tel)
            clean_phones = []
            for p in parts:
                digits = re.sub(r'\D', '', p)
                if len(digits) >= 10 and len(digits) <= 11:
                    digits = '55' + digits
                if len(digits) >= 10:
                    clean_phones.append(digits)
            
            curr["phone"] = clean_phones[0] if clean_phones else ""
            curr["all_phones"] = clean_phones
            
            if curr.get("nome") and (curr.get("email") or curr.get("phone")):
                doctors.append(dict(curr))
            curr = {}
        else:
            # Check if this looks like a name
            if not any(k in line for k in ["Nome do Prescritor", "Encontre um médico", "HOME", "CADASTRO", "CONTATO", "Especialidade:", "Cidade:", "Estado:", "Email:", "Telefone:"]):
                if "nome" not in curr:
                    curr["nome"] = line

    # Deduplicate by email / phone
    unique_doctors = {}
    for doc in doctors:
        key = doc.get("email", "").lower() or doc.get("phone", "")
        if key and key not in unique_doctors:
            unique_doctors[key] = doc

    doctor_list = list(unique_doctors.values())
    print(f"✅ Total de prescritores únicos extraídos: {len(doctor_list)}")

    out_file = r"c:\Users\ricod\Documents\Planta y Raiz Ltda\scripts\prescritores_master_list.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(doctor_list, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Base gravada em {out_file}")

if __name__ == "__main__":
    parse_full()
