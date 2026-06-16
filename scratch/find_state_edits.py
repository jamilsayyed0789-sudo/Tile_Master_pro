import json
import os

log_path = r"C:\Users\akram\.gemini\antigravity\brain\0a5ff801-8237-4c94-a8f0-8cce714614f7\.system_generated\logs\transcript.jsonl"
out_path = r"c:\Personal_Work\Tile_box_calculator\scratch\state_edits.txt"

print("Searching transcript for state variables...")
with open(log_path, 'r', encoding='utf-8') as f, open(out_path, 'w', encoding='utf-8') as out:
    for line in f:
        try:
            step = json.loads(line)
            step_str = json.dumps(step)
            if "camerapreset" in step_str.lower() or "autorotate" in step_str.lower() or "ishotspot" in step_str.lower():
                out.write(f"=== STEP {step.get('step_index')} ===\n")
                out.write(f"Source: {step.get('source')}, Type: {step.get('type')}\n")
                tool_calls = step.get("tool_calls", [])
                for tc in tool_calls:
                    out.write(f"  Tool: {tc.get('name')}\n")
                    out.write(f"  Args: {json.dumps(tc.get('args'), indent=2)}\n")
                out.write("=" * 80 + "\n\n")
        except Exception as e:
            pass
print("Done. Saved to:", out_path)
