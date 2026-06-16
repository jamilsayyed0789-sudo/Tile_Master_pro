import json
import os

log_path = r"C:\Users\akram\.gemini\antigravity\brain\0a5ff801-8237-4c94-a8f0-8cce714614f7\.system_generated\logs\transcript.jsonl"
out_path = r"c:\Personal_Work\Tile_box_calculator\scratch\all_page_edits_full.txt"

print("Dumping all page.tsx edits in full...")
with open(log_path, 'r', encoding='utf-8') as f, open(out_path, 'w', encoding='utf-8') as out:
    for line in f:
        try:
            step = json.loads(line)
            tool_calls = step.get("tool_calls", [])
            for tc in tool_calls:
                args = tc.get("args", {})
                target_file = args.get("TargetFile", "")
                target_file_opt = args.get("AbsolutePath", "")
                if "page.tsx" in target_file or "page.tsx" in target_file_opt:
                    if "room-previewer" in target_file or "room-previewer" in target_file_opt:
                        out.write(f"=== STEP {step.get('step_index')} (Tool: {tc.get('name')}) ===\n")
                        out.write(f"Instruction: {args.get('Instruction')}\n")
                        out.write(f"Description: {args.get('Description')}\n")
                        if "ReplacementChunks" in args:
                            out.write(f"ReplacementChunks:\n{json.dumps(args.get('ReplacementChunks'), indent=2)}\n")
                        if "CodeContent" in args:
                            out.write(f"CodeContent:\n{args.get('CodeContent')}\n")
                        if "TargetContent" in args:
                            out.write(f"TargetContent:\n{args.get('TargetContent')}\n")
                        if "ReplacementContent" in args:
                            out.write(f"ReplacementContent:\n{args.get('ReplacementContent')}\n")
                        out.write("=" * 80 + "\n\n")
        except Exception as e:
            pass
print("Done. Saved to:", out_path)
